import * as fs from 'fs';
import * as path from 'path';

type ExtractedRecord = {
  player?: {
    providerPlayerId?: string;
    fullName?: string;
    nationality?: string[] | string | null;
    position?: string | null;
    birthDate?: string | null;
    heightCm?: number | null;
    teamName?: string | null;
    rawPayload?: Record<string, unknown> | null;
  };
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

function mapPosition(input?: string | null): ManualPlayer['position'] {
  if (!input) return null;
  const value = input.toLowerCase();
  if (value.includes('keeper') || value === 'gk') return 'GK';
  if (
    value.includes('back') ||
    value.includes('defen') ||
    value === 'cb' ||
    value === 'rb' ||
    value === 'lb'
  )
    return 'DEF';
  if (value.includes('midfield') || value === 'cm' || value === 'cdm' || value === 'cam') return 'MID';
  if (value.includes('forward') || value.includes('striker') || value === 'fw' || value === 'st' || value === 'winger') return 'FW';
  return null;
}

function normalizeBirthDate(input?: string | null): string | null {
  if (!input) return null;
  const m = input.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function cleanName(input?: string): string {
  if (!input) return 'Unknown';
  return input.replace(/^#\d+\s*/, '').trim();
}

function clamp(input: string | null, max: number): string | null {
  if (input == null) return null;
  return input.length > max ? input.slice(0, max) : input;
}

function normalizeNationality(input?: string[] | string | null): string | null {
  if (!input) return null;
  if (Array.isArray(input)) return input[0] ?? null;
  return input;
}

function toManualPlayer(row: ExtractedRecord): ManualPlayer | null {
  const p = row.player;
  if (!p?.providerPlayerId) return null;
  return {
    provider: 'manual',
    providerPlayerId: p.providerPlayerId,
    fullName: clamp(cleanName(p.fullName), 160) ?? 'Unknown',
    nationality: clamp(normalizeNationality(p.nationality), 64),
    teamName: clamp(p.teamName ?? null, 96),
    competitionCode: 'TMKT',
    position: mapPosition(p.position),
    birthDate: normalizeBirthDate(p.birthDate),
    heightCm: typeof p.heightCm === 'number' ? p.heightCm : null,
    rawPayload: {
      source: 'transfermarkt-extract',
      originalProvider: 'transfermarkt',
      ...(p.rawPayload ?? {}),
    },
  };
}

function normalizeApiBase(input: string): string {
  const trimmed = input.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
}

async function postBatch(apiBase: string, season: number, batch: ManualPlayer[]) {
  const base = normalizeApiBase(apiBase);
  let res: Response;
  try {
    res = await fetch(`${base}/players/import/manual?generateCards=false`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ season, players: batch }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not reach API at ${base}. Make sure server is running. Root error: ${message}`,
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} from ${base}/players/import/manual: ${body}`);
  }

  return res.json();
}

async function generateCards(apiBase: string, season: number) {
  const base = normalizeApiBase(apiBase);
  let res: Response;
  try {
    res = await fetch(`${base}/cards/generate?season=${season}`, {
      method: 'POST',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not reach ${base}/cards/generate. Root error: ${message}`,
    );
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Card generation failed: HTTP ${res.status}: ${body}`);
  }
  return res.json();
}

function readImportedPlayersCount(result: any): number {
  if (typeof result?.importedPlayers === 'number') return result.importedPlayers;
  if (typeof result?.data?.importedPlayers === 'number')
    return result.data.importedPlayers;
  return 0;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function main() {
  const filePath = process.argv[2];
  const apiBase = process.argv[3] ?? 'http://localhost:3000';
  const season = Number(process.argv[4] ?? '2026');
  const batchSize = Number(process.argv[5] ?? '500');
  const shouldGenerateCards =
    String(process.argv[6] ?? 'true').toLowerCase() !== 'false';

  if (!filePath) {
    throw new Error(
      'Usage: npm run import:transfermarkt -- <jsonFilePath> [apiBase] [season] [batchSize]',
    );
  }

  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, 'utf8');
  const parsed = JSON.parse(raw) as ExtractedRecord[];

  if (!Array.isArray(parsed)) {
    throw new Error('Input file must be a JSON array.');
  }

  const players = parsed.map(toManualPlayer).filter(Boolean) as ManualPlayer[];

  const batches = chunk(players, batchSize);
  let imported = 0;

  for (let i = 0; i < batches.length; i += 1) {
    const currentBatch = batches[i];
    try {
      const result = await postBatch(apiBase, season, currentBatch);
      imported += readImportedPlayersCount(result);
      process.stdout.write(
        `Batch ${i + 1}/${batches.length} done. Imported so far: ${imported}\n`,
      );
    } catch (batchError) {
      process.stderr.write(
        `Batch ${i + 1}/${batches.length} failed (${currentBatch.length} rows). Retrying row-by-row...\n`,
      );
      for (const row of currentBatch) {
        try {
          const result = await postBatch(apiBase, season, [row]);
          imported += readImportedPlayersCount(result);
        } catch (rowError) {
          const message =
            rowError instanceof Error ? rowError.message : String(rowError);
          process.stderr.write(
            `FAILED providerPlayerId=${row.providerPlayerId} name="${row.fullName}" reason=${message}\n`,
          );
        }
      }
      const batchMessage =
        batchError instanceof Error ? batchError.message : String(batchError);
      process.stderr.write(`Batch-level error was: ${batchMessage}\n`);
    }
  }

  if (shouldGenerateCards) {
    process.stdout.write('Player import complete. Generating cards once...\n');
    await generateCards(apiBase, season);
    process.stdout.write('Card generation complete.\n');
  } else {
    process.stdout.write(
      'Player import complete. Skipped card generation (-- false).\n',
    );
  }

  process.stdout.write(
    `Completed. Rows read: ${parsed.length}, normalized: ${players.length}, imported: ${imported}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
