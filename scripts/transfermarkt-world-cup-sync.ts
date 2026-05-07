import * as fs from 'fs';
import * as path from 'path';

type CompetitionSearchResponse = {
  results: Array<{ id: string; name: string; country: string }>;
  lastPageNumber: number;
};

type CompetitionClubsResponse = {
  id: string;
  name: string;
  seasonId: string;
  clubs: Array<{ id: string; name: string }>;
};

type ClubPlayersResponse = {
  id: string;
  players: Array<{
    id: string;
    name: string;
    position?: string | null;
    dateOfBirth?: string | null;
    nationality?: string[] | null;
    height?: number | null;
  }>;
};

type PlayerStatsResponse = {
  id: string;
  stats: Array<Record<string, unknown>>;
};

type ManualPlayer = {
  provider: 'manual';
  providerPlayerId: string;
  fullName: string;
  nationality: string | null;
  teamName: string | null;
  competitionCode: string;
  position: 'GK' | 'DEF' | 'MID' | 'FW' | null;
  birthDate: string | null;
  heightCm: number | null;
  rawPayload: Record<string, unknown>;
};

type ManualStat = {
  providerPlayerId: string;
  season: number;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  interceptions: number;
  dribbles: number;
  yellowCards: number;
  redCards: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(url: string, retries = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 1; i <= retries; i += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (i < retries) await sleep(700 * i);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function normalizeApiBase(input: string, withApi = false): string {
  const trimmed = input.replace(/\/+$/, '');
  if (!withApi) return trimmed;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

function normalizeCountry(input: string): string {
  return input.trim().toLowerCase();
}

function normalizeName(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim();
}

function mapPosition(input?: string | null): ManualPlayer['position'] {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value.includes('keeper') || value === 'gk') return 'GK';
  if (value.includes('def') || value.includes('back') || value.includes('centre-back')) return 'DEF';
  if (value.includes('mid')) return 'MID';
  if (value.includes('forward') || value.includes('striker') || value.includes('wing')) return 'FW';
  return null;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

function aggregateStats(providerPlayerId: string, season: number, rows: Array<Record<string, unknown>>): ManualStat {
  let appearances = 0;
  let minutes = 0;
  let goals = 0;
  let assists = 0;
  let shots = 0;
  let passes = 0;
  let tackles = 0;
  let interceptions = 0;
  let dribbles = 0;
  let yellowCards = 0;
  let redCards = 0;

  for (const row of rows) {
    appearances += pickNumber(row, ['appearances', 'apps', 'matches']);
    minutes += pickNumber(row, ['minutes', 'minutesPlayed']);
    goals += pickNumber(row, ['goals']);
    assists += pickNumber(row, ['assists']);
    shots += pickNumber(row, ['shots', 'shotsTotal']);
    passes += pickNumber(row, ['passes', 'passesTotal']);
    tackles += pickNumber(row, ['tackles']);
    interceptions += pickNumber(row, ['interceptions']);
    dribbles += pickNumber(row, ['dribbles']);
    yellowCards += pickNumber(row, ['yellowCards', 'yellow']);
    redCards += pickNumber(row, ['redCards', 'red']);
  }

  return {
    providerPlayerId,
    season,
    appearances,
    minutes,
    goals,
    assists,
    shots,
    passes,
    tackles,
    interceptions,
    dribbles,
    yellowCards,
    redCards,
  };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function postManualBatch(apiBase: string, season: number, players: ManualPlayer[], stats: ManualStat[]) {
  const url = `${normalizeApiBase(apiBase, true)}/players/import/manual?generateCards=false`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ season, players, stats }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function generateCards(apiBase: string, season: number) {
  const url = `${normalizeApiBase(apiBase, true)}/cards/generate?season=${season}`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

async function main() {
  const countriesFile = process.argv[2];
  const localApiBase = process.argv[3] ?? 'http://localhost:3000';
  const transferApiBase = normalizeApiBase(process.argv[4] ?? 'https://transfermarkt-api.fly.dev');
  const season = Number(process.argv[5] ?? '2026');
  const seasonId = process.argv[6] ?? '2025';
  const batchSize = Number(process.argv[7] ?? '200');
  const maxPages = Number(process.argv[8] ?? '3');
  const expectedSquadFile = process.argv[9];
  const reportOut = path.resolve(process.argv[10] ?? 'tmp/world-cup-sync-report.json');
  const dryRun = String(process.argv[11] ?? 'false').toLowerCase() === 'true';
  const maxClubsPerCountry = Number(process.argv[12] ?? '0');
  const maxPlayersForStats = Number(process.argv[13] ?? '0');
  const maxCompetitionsPerCountry = Number(process.argv[14] ?? '0');

  if (!countriesFile) {
    throw new Error('Usage: npm run transfermarkt:world-cup-sync -- <countriesFile> [localApiBase] [transferApiBase] [season] [seasonId] [batchSize] [maxPages] [expectedSquadFile] [reportOut] [dryRun] [maxClubsPerCountry] [maxPlayersForStats] [maxCompetitionsPerCountry]');
  }

  const countries = JSON.parse(fs.readFileSync(path.resolve(countriesFile), 'utf8')) as string[];
  if (!Array.isArray(countries)) throw new Error('countriesFile must be string array json');

  const clubsByCountry = new Map<string, Map<string, { id: string; name: string }>>();
  const competitionCountByCountry = new Map<string, number>();
  for (const country of countries) {
    let page = 1;
    let lastPage = 1;
    do {
      const res = await fetchJsonWithRetry<CompetitionSearchResponse>(`${transferApiBase}/competitions/search/${encodeURIComponent(country)}?page_number=${page}`);
      lastPage = Math.min(res.lastPageNumber || 1, maxPages);
      const exact = res.results.filter((x) => normalizeCountry(x.country) === normalizeCountry(country));
      for (const comp of exact) {
        if (maxCompetitionsPerCountry > 0) {
          const processed = competitionCountByCountry.get(country) ?? 0;
          if (processed >= maxCompetitionsPerCountry) break;
          competitionCountByCountry.set(country, processed + 1);
        }
        try {
          const clubs = await fetchJsonWithRetry<CompetitionClubsResponse>(`${transferApiBase}/competitions/${comp.id}/clubs?season_id=${encodeURIComponent(seasonId)}`);
          if (!clubsByCountry.has(country)) clubsByCountry.set(country, new Map());
          const bucket = clubsByCountry.get(country)!;
          for (const club of clubs.clubs) {
            if (maxClubsPerCountry > 0 && bucket.size >= maxClubsPerCountry) break;
            bucket.set(club.id, club);
          }
        } catch {}
      }
      page += 1;
    } while (page <= lastPage);
  }

  const playerMap = new Map<string, ManualPlayer>();
  const statMap = new Map<string, ManualStat>();
  for (const [country, clubs] of clubsByCountry.entries()) {
    for (const club of clubs.values()) {
      try {
        const clubPlayers = await fetchJsonWithRetry<ClubPlayersResponse>(`${transferApiBase}/clubs/${club.id}/players?season_id=${encodeURIComponent(seasonId)}`);
        for (const p of clubPlayers.players || []) {
          const playerId = String(p.id);
          playerMap.set(playerId, {
            provider: 'manual',
            providerPlayerId: playerId,
            fullName: p.name || 'Unknown',
            nationality: p.nationality?.[0] || country || null,
            teamName: club.name,
            competitionCode: 'TMKT',
            position: mapPosition(p.position ?? null),
            birthDate: p.dateOfBirth ?? null,
            heightCm: typeof p.height === 'number' ? p.height : null,
            rawPayload: { country, clubId: club.id, source: 'transfermarkt-api', clubPlayer: p },
          });
        }
      } catch {}
    }
  }

  const playersForStats =
    maxPlayersForStats > 0
      ? Array.from(playerMap.values()).slice(0, maxPlayersForStats)
      : Array.from(playerMap.values());
  for (const player of playersForStats) {
    try {
      const statsPayload = await fetchJsonWithRetry<PlayerStatsResponse>(`${transferApiBase}/players/${encodeURIComponent(player.providerPlayerId)}/stats`);
      statMap.set(player.providerPlayerId, aggregateStats(player.providerPlayerId, season, statsPayload.stats || []));
    } catch {
      statMap.set(player.providerPlayerId, aggregateStats(player.providerPlayerId, season, []));
    }
  }

  const players = Array.from(playerMap.values());
  const stats = Array.from(statMap.values());
  let importedPlayers = 0;
  let importedStats = 0;
  if (!dryRun) {
    const playerBatches = chunk(players, batchSize);
    for (let i = 0; i < playerBatches.length; i += 1) {
      const pb = playerBatches[i];
      const ids = new Set(pb.map((x) => x.providerPlayerId));
      const sb = stats.filter((x) => ids.has(x.providerPlayerId));
      const result = await postManualBatch(localApiBase, season, pb, sb);
      importedPlayers += Number(result?.importedPlayers ?? result?.data?.importedPlayers ?? 0);
      importedStats += Number(result?.importedStats ?? result?.data?.importedStats ?? 0);
      process.stdout.write(`Imported batch ${i + 1}/${playerBatches.length}\n`);
    }
    await generateCards(localApiBase, season);
  }

  let expectedCount = 0;
  let missingPlayers: string[] = [];
  if (expectedSquadFile) {
    const expectedRaw = JSON.parse(fs.readFileSync(path.resolve(expectedSquadFile), 'utf8')) as Array<string | { fullName?: string }>;
    const expectedNames = expectedRaw
      .map((x) => (typeof x === 'string' ? x : x?.fullName || ''))
      .filter(Boolean)
      .map(normalizeName);
    expectedCount = expectedNames.length;
    const existing = new Set(players.map((x) => normalizeName(x.fullName)));
    missingPlayers = expectedNames.filter((x) => !existing.has(x));
  }

  const report = {
    createdAt: new Date().toISOString(),
    season,
    seasonId,
    countries,
    clubsDiscovered: Array.from(clubsByCountry.entries()).map(([country, map]) => ({
      country,
      clubs: Array.from(map.values()).length,
    })),
    discoveredPlayers: players.length,
    discoveredStats: stats.length,
    dryRun,
    importedPlayers,
    importedStats,
    expectedWorldCupPlayers: expectedCount,
    missingWorldCupPlayers: missingPlayers,
    missingCount: missingPlayers.length,
  };

  fs.mkdirSync(path.dirname(reportOut), { recursive: true });
  fs.writeFileSync(reportOut, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`Saved report: ${reportOut}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
