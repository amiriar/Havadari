import * as dotenv from 'dotenv';
import { Client } from 'pg';

dotenv.config();

async function main() {
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

  const rarityCounts = await client.query(
    'SELECT rarity, COUNT(*)::int AS count FROM cards GROUP BY rarity ORDER BY rarity',
  );

  const enumLabels = await client.query(`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'cards_rarity_enum'
    ORDER BY e.enumsortorder
  `);

  console.log(`RARITY_COUNTS=${JSON.stringify(rarityCounts.rows)}`);
  console.log(`ENUM_LABELS=${JSON.stringify(enumLabels.rows)}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

