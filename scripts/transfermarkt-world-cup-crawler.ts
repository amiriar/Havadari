import * as fs from 'fs';
import * as path from 'path';

type CompetitionSearchResponse = {
  pageNumber: number;
  lastPageNumber: number;
  results: Array<{ id: string; name: string; country: string }>;
};

type CompetitionClubsResponse = {
  id: string;
  name: string;
  seasonId: string;
  clubs: Array<{ id: string; name: string }>;
};

type ClubSearchResponse = {
  results: Array<{
    id: string;
    name: string;
    country?: string;
    squad?: number;
    marketValue?: number;
  }>;
};

type ClubPlayersResponse = {
  id: string;
  players: Array<{
    id: string;
    name: string;
    position?: string;
    dateOfBirth?: string;
    nationality?: string[];
    height?: number;
    marketValue?: number;
  }>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(input: string): string {
  return input.toLowerCase().replace(/\s+/g, ' ').trim();
}

function normalizeApiBase(input: string): string {
  return input.replace(/\/+$/, '');
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
      if (i < retries) await sleep(500 * i);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function searchCompetitionsByCountry(
  apiBase: string,
  country: string,
  maxPages: number,
) {
  const out: CompetitionSearchResponse['results'] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const url = `${apiBase}/competitions/search/${encodeURIComponent(country)}?page_number=${page}`;
    const res = await fetchJsonWithRetry<CompetitionSearchResponse>(url);
    lastPage = Math.min(res.lastPageNumber || 1, maxPages);
    out.push(
      ...res.results.filter((x) => normalize(x.country) === normalize(country)),
    );
    page += 1;
  } while (page <= lastPage);
  return out;
}

function resolveClubByName(
  clubName: string,
  country: string,
  results: ClubSearchResponse['results'],
) {
  const byCountry = results.filter(
    (x) => !x.country || normalize(x.country) === normalize(country),
  );
  const pool = byCountry.length ? byCountry : results;
  const exact = pool.find((x) => normalize(x.name) === normalize(clubName));
  if (exact) return exact;
  return pool[0] ?? null;
}

async function main() {
  const countriesFile = process.argv[2];
  const outputFile =
    process.argv[3] ?? 'tmp/world-cup-country-leagues-teams-players.json';
  const apiBase = normalizeApiBase(
    process.argv[4] ?? 'https://transfermarkt-api.fly.dev',
  );
  const seasonId = process.argv[5] ?? '2025';
  const maxCompetitionPages = Number(process.argv[6] ?? '2');
  const maxTeamsPerCountry = Number(process.argv[7] ?? '0');

  if (!countriesFile) {
    throw new Error(
      'Usage: npm run transfermarkt:world-cup-crawler -- <countriesFile> [outputFile] [apiBase] [seasonId] [maxCompetitionPages] [maxTeamsPerCountry]',
    );
  }

  const countriesRaw = fs
    .readFileSync(path.resolve(countriesFile), 'utf8')
    .replace(/^\uFEFF/, '');
  const countries = JSON.parse(countriesRaw) as string[];
  if (!Array.isArray(countries)) {
    throw new Error('countriesFile must be a JSON string array.');
  }

  const report: any = {
    createdAt: new Date().toISOString(),
    apiBase,
    seasonId,
    countries: [] as any[],
  };

  for (const country of countries) {
    process.stdout.write(`Country: ${country}\n`);
    const countryNode: any = {
      country,
      competitions: [] as any[],
      teams: [] as any[],
    };
    let competitions: CompetitionSearchResponse['results'] = [];
    try {
      competitions = await searchCompetitionsByCountry(
        apiBase,
        country,
        maxCompetitionPages,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      countryNode.error = `competition-search-failed: ${message}`;
      report.countries.push(countryNode);
      process.stderr.write(`Country failed: ${country} -> ${message}\n`);
      continue;
    }
    const seenResolvedClubIds = new Set<string>();

    for (const comp of competitions) {
      try {
        const clubsPayload = await fetchJsonWithRetry<CompetitionClubsResponse>(
          `${apiBase}/competitions/${comp.id}/clubs?season_id=${encodeURIComponent(seasonId)}`,
        );
        countryNode.competitions.push({
          id: comp.id,
          name: comp.name,
          seasonId: clubsPayload.seasonId,
          clubsCount: clubsPayload.clubs.length,
        });

        for (const club of clubsPayload.clubs) {
          if (
            maxTeamsPerCountry > 0 &&
            countryNode.teams.length >= maxTeamsPerCountry
          ) {
            break;
          }
          try {
            const searched = await fetchJsonWithRetry<ClubSearchResponse>(
              `${apiBase}/clubs/search/${encodeURIComponent(club.name)}?page_number=1`,
            );
            const resolved = resolveClubByName(club.name, country, searched.results);
            if (!resolved || seenResolvedClubIds.has(resolved.id)) continue;

            const playersPayload = await fetchJsonWithRetry<ClubPlayersResponse>(
              `${apiBase}/clubs/${resolved.id}/players?season_id=${encodeURIComponent(seasonId)}`,
            );
            seenResolvedClubIds.add(resolved.id);
            countryNode.teams.push({
              source: { id: club.id, name: club.name },
              resolved: {
                id: resolved.id,
                name: resolved.name,
                country: resolved.country ?? null,
              },
              playersCount: playersPayload.players.length,
              players: playersPayload.players,
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            countryNode.teams.push({
              source: { id: club.id, name: club.name },
              error: message,
            });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        countryNode.competitions.push({
          id: comp.id,
          name: comp.name,
          error: message,
        });
      }
    }
    report.countries.push(countryNode);
    process.stdout.write(
      `Done: ${country} -> competitions=${countryNode.competitions.length}, teams=${countryNode.teams.length}\n`,
    );
  }

  const absOutput = path.resolve(outputFile);
  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`Saved: ${absOutput}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
