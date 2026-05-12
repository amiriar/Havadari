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

  const stats = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "marketValue" IS NOT NULL)::int AS with_market,
      MIN("marketValue") FILTER (WHERE "marketValue" IS NOT NULL)::bigint AS min_mv,
      MAX("marketValue") FILTER (WHERE "marketValue" IS NOT NULL)::bigint AS max_mv,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p25,
      PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p50,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p75,
      PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p90,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p95,
      PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "marketValue") FILTER (WHERE "marketValue" IS NOT NULL) AS p99
    FROM cards
  `);

  const top = await client.query(`
    SELECT "playerName", "marketValue"
    FROM cards
    WHERE "marketValue" IS NOT NULL
    ORDER BY "marketValue" DESC
    LIMIT 20
  `);

  console.log(JSON.stringify(stats.rows[0], null, 2));
  console.log(`TOP20=${JSON.stringify(top.rows)}`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

