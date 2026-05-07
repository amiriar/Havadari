import * as fs from 'fs';
import * as path from 'path';

type CompetitionSearchResponse = {
  query: string;
  pageNumber: number;
  lastPageNumber: number;
  results: Array<{
    id: string;
    name: string;
    country: string;
    clubs: number;
  }>;
};

type CompetitionClubsResponse = {
  id: string;
  name: string;
  seasonId: string;
  clubs: Array<{
    id: string;
    name: string;
  }>;
};

type CountryClubOutput = {
  country: string;
  clubs: Array<{
    id: string;
    name: string;
    sourceCompetitions: Array<{
      id: string;
      name: string;
      seasonId: string;
    }>;
  }>;
};

function normalizeApiBase(input: string): string {
  return input.replace(/\/+$/, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry<T>(
  url: string,
  retries = 3,
  backoffMs = 1200,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body}`);
      }
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(backoffMs * attempt);
      }
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Failed request ${url}. ${message}`);
}

function normalizeCountry(input: string): string {
  return input.trim().toLowerCase();
}

async function searchCompetitionsByCountry(
  apiBase: string,
  countryName: string,
  maxPages: number,
): Promise<CompetitionSearchResponse['results']> {
  const out: CompetitionSearchResponse['results'] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const url = `${apiBase}/competitions/search/${encodeURIComponent(countryName)}?page_number=${page}`;
    const res = await fetchJsonWithRetry<CompetitionSearchResponse>(url);
    lastPage = Math.min(res.lastPageNumber || 1, maxPages);
    out.push(
      ...res.results.filter(
        (r) => normalizeCountry(r.country) === normalizeCountry(countryName),
      ),
    );
    page += 1;
  } while (page <= lastPage);

  return out;
}

async function getCompetitionClubs(
  apiBase: string,
  competitionId: string,
  seasonId?: string,
): Promise<CompetitionClubsResponse> {
  const seasonPart = seasonId ? `?season_id=${encodeURIComponent(seasonId)}` : '';
  const url = `${apiBase}/competitions/${competitionId}/clubs${seasonPart}`;
  return fetchJsonWithRetry<CompetitionClubsResponse>(url);
}

async function main() {
  const countriesFile = process.argv[2];
  const outputFile = process.argv[3] ?? 'tmp/world-cup-country-clubs.json';
  const apiBaseInput = process.argv[4] ?? 'https://transfermarkt-api.fly.dev';
  const seasonId = process.argv[5] || undefined;
  const maxPages = Number(process.argv[6] ?? '3');

  if (!countriesFile) {
    throw new Error(
      'Usage: npm run transfermarkt:world-cup-clubs -- <countriesJsonFile> [outputFile] [apiBase] [seasonId] [maxPages]',
    );
  }

  const apiBase = normalizeApiBase(apiBaseInput);
  const countriesPath = path.resolve(countriesFile);
  const outputPath = path.resolve(outputFile);
  const countriesRaw = fs.readFileSync(countriesPath, 'utf8');
  const countries = JSON.parse(countriesRaw) as string[];

  if (!Array.isArray(countries) || countries.some((x) => typeof x !== 'string')) {
    throw new Error('countriesJsonFile must be a JSON string array.');
  }

  const result: CountryClubOutput[] = [];

  for (const country of countries) {
    process.stdout.write(`Resolving country: ${country}\n`);
    const competitions = await searchCompetitionsByCountry(apiBase, country, maxPages);
    const clubMap = new Map<
      string,
      {
        id: string;
        name: string;
        sourceCompetitions: Array<{ id: string; name: string; seasonId: string }>;
      }
    >();

    for (const competition of competitions) {
      try {
        const clubsPayload = await getCompetitionClubs(apiBase, competition.id, seasonId);
        for (const club of clubsPayload.clubs) {
          const existing = clubMap.get(club.id);
          const source = {
            id: clubsPayload.id,
            name: clubsPayload.name,
            seasonId: clubsPayload.seasonId,
          };

          if (!existing) {
            clubMap.set(club.id, {
              id: club.id,
              name: club.name,
              sourceCompetitions: [source],
            });
          } else if (
            !existing.sourceCompetitions.some(
              (x) => x.id === source.id && x.seasonId === source.seasonId,
            )
          ) {
            existing.sourceCompetitions.push(source);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `Failed competition ${competition.id} (${competition.name}) for ${country}: ${message}\n`,
        );
      }
    }

    result.push({
      country,
      clubs: Array.from(clubMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    });
    process.stdout.write(
      `Country done: ${country} -> ${clubMap.size} unique clubs\n`,
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        apiBase,
        seasonId: seasonId ?? null,
        countries: result,
      },
      null,
      2,
    ),
    'utf8',
  );

  process.stdout.write(`Saved: ${outputPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
