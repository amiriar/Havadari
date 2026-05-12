import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { PlayerPositionEnum } from '@app/players/constants/player.enums';
import { CardRarityEnum } from '../constants/card.enums';
import { PlayerRatingService } from './player-rating.service';

describe('PlayerRatingService', () => {
  const service = new PlayerRatingService();

  const makePlayer = (position: PlayerPositionEnum): Player =>
    ({
      position,
    }) as Player;

  const makeStats = (patch?: Partial<PlayerStatSnapshot>): PlayerStatSnapshot =>
    ({
      appearances: 30,
      minutes: 2400,
      goals: 12,
      assists: 7,
      passes: 1400,
      tackles: 40,
      interceptions: 20,
      dribbles: 50,
      ...patch,
    }) as PlayerStatSnapshot;

  it('calculates deterministic bounded ratings', () => {
    const player = makePlayer(PlayerPositionEnum.FW);
    const ratingsA = service.calculate(player, makeStats());
    const ratingsB = service.calculate(player, makeStats());

    expect(ratingsA).toEqual(ratingsB);
    expect(ratingsA.overall).toBeGreaterThanOrEqual(1);
    expect(ratingsA.overall).toBeLessThanOrEqual(99);
  });

  it('maps rarity from market value thresholds', () => {
    expect(service.rarityFromMarketValue(100_000)).toBe(CardRarityEnum.COMMON);
    expect(service.rarityFromMarketValue(700_000)).toBe(CardRarityEnum.RARE);
    expect(service.rarityFromMarketValue(7_000_000)).toBe(CardRarityEnum.EPIC);
    expect(service.rarityFromMarketValue(30_000_000)).toBe(
      CardRarityEnum.LEGENDARY,
    );
    expect(service.rarityFromMarketValue(120_000_000)).toBe(
      CardRarityEnum.MYTHIC,
    );
    expect(service.rarityFromMarketValue(30_000_000, true)).toBe(
      CardRarityEnum.IDOL,
    );
  });

  it('maps base value by rarity', () => {
    expect(service.baseValue(CardRarityEnum.COMMON)).toBe(100);
    expect(service.baseValue(CardRarityEnum.RARE)).toBe(500);
    expect(service.baseValue(CardRarityEnum.EPIC)).toBe(2000);
    expect(service.baseValue(CardRarityEnum.LEGENDARY)).toBe(8000);
    expect(service.baseValue(CardRarityEnum.MYTHIC)).toBe(30000);
    expect(service.baseValue(CardRarityEnum.IDOL)).toBe(100000);
  });
});
