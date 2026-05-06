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
    fullName: cleanName(p.fullName),
    nationality: normalizeNationality(p.nationality),
    teamName: p.teamName ?? null,
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

async function postBatch(apiBase: string, season: number, batch: ManualPlayer[]) {
  const res = await fetch(`${apiBase}/players/import/manual`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ season, players: batch }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return res.json();
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
    const result = await postBatch(apiBase, season, batches[i]);
    imported += Number(result?.importedPlayers || 0);
    process.stdout.write(
      `Batch ${i + 1}/${batches.length} done. Imported so far: ${imported}\n`,
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
