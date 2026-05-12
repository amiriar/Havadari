import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

const IMAGE_ROOT = path.resolve('uploads/cards/images');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function normalizeName(value: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/[0-9]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-.]+|[\s\-.]+$/g, '');
}

function foldDiacritics(value: string): string {
  return normalizeName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toAvatarUrl(filePath: string): string {
  const relative = path
    .relative(path.resolve('.'), filePath)
    .replace(/\\/g, '/');
  return `/${relative}`;
}

async function main() {
  const shouldApply = process.argv.includes('--apply');
  if (!fs.existsSync(IMAGE_ROOT)) {
    throw new Error(`Image root does not exist: ${IMAGE_ROOT}`);
  }

  const imageFiles = walkFiles(IMAGE_ROOT).filter((filePath) =>
    IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );

  const byNormalized = new Map<string, string[]>();
  const byFolded = new Map<string, string[]>();

  for (const filePath of imageFiles) {
    const base = path.basename(filePath, path.extname(filePath));
    const n = normalizeName(base);
    const f = foldDiacritics(base);

    if (!byNormalized.has(n)) byNormalized.set(n, []);
    byNormalized.get(n)!.push(filePath);

    if (!byFolded.has(f)) byFolded.set(f, []);
    byFolded.get(f)!.push(filePath);
  }

  const client = new Client(
    process.env.DB_CONNECTION_STRING
      ? { connectionString: process.env.DB_CONNECTION_STRING }
      : {
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT || 5432),
          user: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        },
  );

  await client.connect();

  const cardsResult = await client.query('SELECT * FROM cards');
  const cards = cardsResult.rows as Array<{
    id: string;
    playerName?: string;
    avatarUrl?: string | null;
  }>;

  let uniqueMatch = 0;
  let ambiguous = 0;
  let missing = 0;
  let updated = 0;
  const ambiguousSamples: Array<{ id: string; name: string; candidates: string[] }> = [];
  const missingSamples: Array<{ id: string; name: string }> = [];

  for (const card of cards) {
    const playerName = card.playerName || '';
    const n = normalizeName(playerName);
    const f = foldDiacritics(playerName);

    const directCandidates = byNormalized.get(n) || [];
    const foldedCandidates = byFolded.get(f) || [];
    const candidates =
      directCandidates.length > 0 ? directCandidates : foldedCandidates;
    const uniqueCandidates = Array.from(new Set(candidates));

    if (uniqueCandidates.length === 0) {
      missing += 1;
      if (missingSamples.length < 20) {
        missingSamples.push({ id: card.id, name: playerName });
      }
      continue;
    }

    if (uniqueCandidates.length > 1) {
      ambiguous += 1;
      if (ambiguousSamples.length < 20) {
        ambiguousSamples.push({
          id: card.id,
          name: playerName,
          candidates: uniqueCandidates.slice(0, 3).map(toAvatarUrl),
        });
      }
      continue;
    }

    uniqueMatch += 1;
    const avatarUrl = toAvatarUrl(uniqueCandidates[0]);

    if (card.avatarUrl === avatarUrl) {
      continue;
    }

    if (shouldApply) {
      await client.query(
        'UPDATE cards SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE id = $2',
        [avatarUrl, card.id],
      );
    }
    updated += 1;
  }

  await client.end();

  console.log(`MODE=${shouldApply ? 'apply' : 'dry-run'}`);
  console.log(`CARDS=${cards.length}`);
  console.log(`FILES=${imageFiles.length}`);
  console.log(`UNIQUE_MATCH=${uniqueMatch}`);
  console.log(`AMBIGUOUS=${ambiguous}`);
  console.log(`MISSING=${missing}`);
  console.log(`UPDATED=${updated}`);
  console.log(`AMBIGUOUS_SAMPLE=${JSON.stringify(ambiguousSamples)}`);
  console.log(`MISSING_SAMPLE=${JSON.stringify(missingSamples)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

