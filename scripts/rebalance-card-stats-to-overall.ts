import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

type CardRow = {
  id: string;
  position: 'GK' | 'DEF' | 'MID' | 'FW' | string;
  overallRating: number | string;
  speed: number | string;
  power: number | string;
  skill: number | string;
  attack: number | string;
  defend: number | string;
};

type StatBlock = {
  speed: number;
  power: number;
  skill: number;
  attack: number;
  defend: number;
};

const OFFSETS: Record<string, StatBlock> = {
  GK: { speed: -6, power: 2, skill: 4, attack: -12, defend: 12 },
  DEF: { speed: 1, power: 4, skill: -1, attack: -8, defend: 4 },
  MID: { speed: 2, power: -1, skill: 4, attack: 1, defend: -6 },
  FW: { speed: 4, power: 2, skill: 1, attack: 8, defend: -15 },
};

const PRIORITY_INC: Record<string, Array<keyof StatBlock>> = {
  GK: ['defend', 'skill', 'power', 'speed', 'attack'],
  DEF: ['defend', 'power', 'speed', 'skill', 'attack'],
  MID: ['skill', 'speed', 'attack', 'defend', 'power'],
  FW: ['attack', 'speed', 'skill', 'power', 'defend'],
};

const PRIORITY_DEC: Record<string, Array<keyof StatBlock>> = {
  GK: ['attack', 'speed', 'power', 'skill', 'defend'],
  DEF: ['attack', 'skill', 'speed', 'power', 'defend'],
  MID: ['power', 'defend', 'attack', 'speed', 'skill'],
  FW: ['defend', 'power', 'skill', 'speed', 'attack'],
};

function clamp(v: number): number {
  return Math.max(1, Math.min(99, v));
}

function asInt(v: number | string): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  return Math.round(n);
}

function sumStats(s: StatBlock): number {
  return s.speed + s.power + s.skill + s.attack + s.defend;
}

function rebalanceToOverall(position: string, overall: number): StatBlock {
  const offsets = OFFSETS[position] || OFFSETS.MID;
  const incOrder = PRIORITY_INC[position] || PRIORITY_INC.MID;
  const decOrder = PRIORITY_DEC[position] || PRIORITY_DEC.MID;

  const stats: StatBlock = {
    speed: clamp(Math.round(overall + offsets.speed)),
    power: clamp(Math.round(overall + offsets.power)),
    skill: clamp(Math.round(overall + offsets.skill)),
    attack: clamp(Math.round(overall + offsets.attack)),
    defend: clamp(Math.round(overall + offsets.defend)),
  };

  const target = overall * 5;
  let diff = target - sumStats(stats);

  while (diff !== 0) {
    let changed = false;
    const keys = diff > 0 ? incOrder : decOrder;
    for (const key of keys) {
      if (diff > 0 && stats[key] < 99) {
        stats[key] += 1;
        diff -= 1;
        changed = true;
      } else if (diff < 0 && stats[key] > 1) {
        stats[key] -= 1;
        diff += 1;
        changed = true;
      }
      if (diff === 0) break;
    }
    if (diff === 0) break;
    if (!changed) {
      // Last-resort pass across all stats to guarantee convergence.
      const all: Array<keyof StatBlock> = ['speed', 'power', 'skill', 'attack', 'defend'];
      for (const key of all) {
        if (diff > 0 && stats[key] < 99) {
          stats[key] += 1;
          diff -= 1;
          changed = true;
        } else if (diff < 0 && stats[key] > 1) {
          stats[key] -= 1;
          diff += 1;
          changed = true;
        }
        if (diff === 0) break;
      }
      if (!changed) break;
    }
  }

  return stats;
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
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

  const res = await client.query(
    'SELECT id, position, "overallRating", speed, power, skill, attack, defend FROM cards',
  );
  const rows = res.rows as CardRow[];

  let updated = 0;
  let unchanged = 0;

  for (const row of rows) {
    const overall = clamp(asInt(row.overallRating));
    const next = rebalanceToOverall(row.position || 'MID', overall);
    const same =
      asInt(row.speed) === next.speed &&
      asInt(row.power) === next.power &&
      asInt(row.skill) === next.skill &&
      asInt(row.attack) === next.attack &&
      asInt(row.defend) === next.defend;

    if (same) {
      unchanged += 1;
      continue;
    }

    if (!dryRun) {
      await client.query(
        `UPDATE cards
         SET speed=$1, power=$2, skill=$3, attack=$4, defend=$5, "updatedAt"=NOW()
         WHERE id=$6`,
        [next.speed, next.power, next.skill, next.attack, next.defend, row.id],
      );
    }

    updated += 1;
  }

  const verify = await client.query(`
    SELECT COUNT(*)::int AS mismatch_count
    FROM cards
    WHERE (speed + power + skill + attack + defend) <> ("overallRating" * 5)
  `);

  console.log(`MODE=${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`TOTAL=${rows.length}`);
  console.log(`UPDATED=${updated}`);
  console.log(`UNCHANGED=${unchanged}`);
  console.log(`MISMATCH_AFTER=${verify.rows[0].mismatch_count}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

