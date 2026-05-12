import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { PlayerRatingService } from '../src/modules/cards/services/player-rating.service';

dotenv.config();

type PlayerRow = {
  id: string;
  provider: string | null;
  providerPlayerId: string | null;
  fullName: string | null;
  nationality: string | null;
  position: string | null;
  birthDate: string | null;
  heightCm: number | null;
  rawPayload: Record<string, unknown> | null;
};

function readPlayerMarketValue(player: PlayerRow): number | null {
  const raw = (player.rawPayload || {}) as Record<string, unknown>;
  const direct = raw.marketValue;
  if (typeof direct === 'number' && Number.isFinite(direct)) return Math.round(direct);
  if (typeof direct === 'string' && direct.trim() && Number.isFinite(Number(direct))) {
    return Math.round(Number(direct));
  }
  const nestedPlayer = raw.player as Record<string, unknown> | undefined;
  const nested = nestedPlayer?.marketValue;
  if (typeof nested === 'number' && Number.isFinite(nested)) return Math.round(nested);
  if (typeof nested === 'string' && nested.trim() && Number.isFinite(Number(nested))) {
    return Math.round(Number(nested));
  }
  return null;
}

function isRetiredLegend(player: PlayerRow, overall: number): boolean {
  const payload = (player.rawPayload || {}) as Record<string, unknown>;
  const status = String(payload.status || payload.playerStatus || '').toLowerCase();
  const explicitlyRetired =
    payload.retired === true || payload.active === false || status.includes('retired');
  return explicitlyRetired && overall >= 90;
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const ratingService = new PlayerRatingService();
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

  const cardsRes = await client.query(
    'SELECT id, "sourceProvider", "sourceProviderPlayerId", "marketValue", rarity, "overallRating", speed, power, skill, attack, defend, "baseValue" FROM cards',
  );
  const cards = cardsRes.rows;

  const playersRes = await client.query(
    'SELECT id, provider, "providerPlayerId", "fullName", nationality, position, "birthDate", "heightCm", "rawPayload" FROM players',
  );
  const playersMap = new Map<string, PlayerRow>();
  for (const p of playersRes.rows as PlayerRow[]) {
    playersMap.set(`${p.provider ?? ''}::${p.providerPlayerId ?? ''}`, p);
  }

  const statsRes = await client.query(`
    SELECT DISTINCT ON ("playerId")
      "playerId",
      appearances,
      minutes,
      goals,
      assists,
      passes,
      tackles,
      interceptions,
      dribbles,
      season,
      "createdAt"
    FROM player_stat_snapshots
    ORDER BY "playerId", season DESC, "createdAt" DESC
  `);
  const statsMap = new Map<string, any>();
  for (const s of statsRes.rows) {
    statsMap.set(s.playerId, s);
  }

  let updated = 0;
  let skippedNoPlayer = 0;
  let skippedNoStats = 0;

  for (const card of cards) {
    const player = playersMap.get(
      `${card.sourceProvider ?? ''}::${card.sourceProviderPlayerId ?? ''}`,
    );
    if (!player) {
      skippedNoPlayer += 1;
      continue;
    }

    const latestStats = statsMap.get(player.id) ?? null;

    const hasStats = ratingService.hasMeaningfulStats(latestStats);
    const ratings = ratingService.calculate(player as any, latestStats as any);
    if (!hasStats) {
      ratings.overall = ratingService.deterministicFallbackOverall(player as any);
      skippedNoStats += 1;
    }

    const marketValue = readPlayerMarketValue(player);
    const rarity = ratingService.rarityFromMarketValue(
      marketValue,
      isRetiredLegend(player, ratings.overall),
    );
    const tuned = ratingService.tuneRatingsByMarketValue(
      ratings,
      marketValue,
      rarity,
    );
    const baseValue = ratingService.adjustedBaseValue(rarity, tuned.overall);

    const changed =
      Number(card.marketValue ?? 0) !== Number(marketValue ?? 0) ||
      card.rarity !== rarity ||
      Number(card.overallRating) !== tuned.overall ||
      Number(card.speed) !== tuned.speed ||
      Number(card.power) !== tuned.power ||
      Number(card.skill) !== tuned.skill ||
      Number(card.attack) !== tuned.attack ||
      Number(card.defend) !== tuned.defend ||
      Number(card.baseValue) !== baseValue;

    if (!changed) continue;

    if (!dryRun) {
      await client.query(
        `UPDATE cards
         SET "marketValue" = $1,
             rarity = $2,
             "overallRating" = $3,
             speed = $4,
             power = $5,
             skill = $6,
             attack = $7,
             defend = $8,
             "baseValue" = $9,
             "updatedAt" = NOW()
         WHERE id = $10`,
        [
          marketValue,
          rarity,
          tuned.overall,
          tuned.speed,
          tuned.power,
          tuned.skill,
          tuned.attack,
          tuned.defend,
          baseValue,
          card.id,
        ],
      );
    }
    updated += 1;
  }

  console.log(`MODE=${dryRun ? 'dry-run' : 'apply'}`);
  console.log(`TOTAL=${cards.length}`);
  console.log(`UPDATED=${updated}`);
  console.log(`SKIPPED_NO_PLAYER=${skippedNoPlayer}`);
  console.log(`FALLBACK_NO_STATS=${skippedNoStats}`);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
