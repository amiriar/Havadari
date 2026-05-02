import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { PlayerRatingService } from './player-rating.service';

describe('PlayerRatingService', () => {
  const service = new PlayerRatingService();

  const makePlayer = (position: Player['position']): Player =>
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
    const player = makePlayer('FW');
    const ratingsA = service.calculate(player, makeStats());
    const ratingsB = service.calculate(player, makeStats());

    expect(ratingsA).toEqual(ratingsB);
    expect(ratingsA.overall).toBeGreaterThanOrEqual(1);
    expect(ratingsA.overall).toBeLessThanOrEqual(99);
  });

  it('maps rarity from overall thresholds', () => {
    expect(service.rarity(79)).toBe('COMMON');
    expect(service.rarity(80)).toBe('RARE');
    expect(service.rarity(88)).toBe('EPIC');
    expect(service.rarity(94)).toBe('LEGENDARY');
    expect(service.rarity(98)).toBe('MYTHIC');
  });

  it('maps base value by rarity', () => {
    expect(service.baseValue('COMMON')).toBe(100);
    expect(service.baseValue('RARE')).toBe(500);
    expect(service.baseValue('EPIC')).toBe(2000);
    expect(service.baseValue('LEGENDARY')).toBe(8000);
    expect(service.baseValue('MYTHIC')).toBe(30000);
  });
});
