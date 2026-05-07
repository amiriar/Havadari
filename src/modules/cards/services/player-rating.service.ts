import { Injectable } from '@nestjs/common';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { CardRarityEnum } from '../constants/card.enums';

export interface CardRatings {
  speed: number;
  power: number;
  skill: number;
  attack: number;
  defend: number;
  overall: number;
}

@Injectable()
export class PlayerRatingService {
  private readonly RARITY_FLOORS: Record<CardRarityEnum, number> = {
    [CardRarityEnum.COMMON]: 55,
    [CardRarityEnum.RARE]: 70,
    [CardRarityEnum.EPIC]: 80,
    [CardRarityEnum.LEGENDARY]: 90,
    [CardRarityEnum.MYTHIC]: 96,
  };

  private readonly RARITY_CEILINGS: Record<CardRarityEnum, number> = {
    [CardRarityEnum.COMMON]: 79,
    [CardRarityEnum.RARE]: 87,
    [CardRarityEnum.EPIC]: 93,
    [CardRarityEnum.LEGENDARY]: 98,
    [CardRarityEnum.MYTHIC]: 99,
  };

  calculate(player: Player, stats: PlayerStatSnapshot | null): CardRatings {
    const appearances = stats?.appearances || 0;
    const minutes = stats?.minutes || 0;
    const goals = stats?.goals || 0;
    const assists = stats?.assists || 0;
    const passes = stats?.passes || 0;
    const tackles = stats?.tackles || 0;
    const interceptions = stats?.interceptions || 0;
    const dribbles = stats?.dribbles || 0;

    const activity = Math.min(10, Math.floor(minutes / 250));
    const attack = this.clamp(
      40 + goals * 2 + assists + Math.floor(dribbles / 3) + activity,
    );
    const defend = this.clamp(35 + tackles + interceptions + activity);
    const skill = this.clamp(
      45 + Math.floor(passes / 20) + Math.floor(dribbles / 2),
    );
    const speed = this.clamp(
      45 + Math.floor(appearances / 2) + Math.floor(dribbles / 3),
    );
    const power = this.clamp(45 + Math.floor((goals + tackles) / 2) + activity);

    const position = player.position || 'MID';
    const weighted =
      position === 'GK'
        ? speed * 0.1 +
          power * 0.2 +
          skill * 0.25 +
          attack * 0.05 +
          defend * 0.4
        : position === 'DEF'
          ? speed * 0.2 +
            power * 0.25 +
            skill * 0.15 +
            attack * 0.1 +
            defend * 0.3
          : position === 'MID'
            ? speed * 0.2 +
              power * 0.15 +
              skill * 0.3 +
              attack * 0.2 +
              defend * 0.15
            : speed * 0.25 +
              power * 0.2 +
              skill * 0.2 +
              attack * 0.3 +
              defend * 0.05;

    return {
      speed,
      power,
      skill,
      attack,
      defend,
      overall: this.clamp(Math.round(weighted)),
    };
  }

  rarity(overall: number): CardRarityEnum {
    if (overall >= 96) return CardRarityEnum.MYTHIC;
    if (overall >= 90) return CardRarityEnum.LEGENDARY;
    if (overall >= 80) return CardRarityEnum.EPIC;
    if (overall >= 70) return CardRarityEnum.RARE;
    return CardRarityEnum.COMMON;
  }

  baseValue(rarity: CardRarityEnum): number {
    switch (rarity) {
      case CardRarityEnum.COMMON:
        return 100;
      case CardRarityEnum.RARE:
        return 500;
      case CardRarityEnum.EPIC:
        return 2000;
      case CardRarityEnum.LEGENDARY:
        return 8000;
      case CardRarityEnum.MYTHIC:
        return 30000;
    }
  }

  weeklyPerformanceScore(stats: PlayerStatSnapshot | null): number {
    if (!stats) return 0;
    const goals = stats.goals || 0;
    const assists = stats.assists || 0;
    const tackles = stats.tackles || 0;
    const interceptions = stats.interceptions || 0;
    const dribbles = stats.dribbles || 0;
    const minutes = stats.minutes || 0;
    const score =
      goals * 8 +
      assists * 6 +
      tackles * 2 +
      interceptions * 2 +
      dribbles +
      Math.floor(minutes / 90);
    return Math.max(0, Math.min(100, score));
  }

  hasMeaningfulStats(stats: PlayerStatSnapshot | null): boolean {
    if (!stats) return false;
    const sum =
      (stats.minutes || 0) +
      (stats.appearances || 0) +
      (stats.goals || 0) +
      (stats.assists || 0) +
      (stats.passes || 0) +
      (stats.tackles || 0) +
      (stats.interceptions || 0) +
      (stats.dribbles || 0);
    return sum > 0;
  }

  deterministicFallbackOverall(player: Player): number {
    const age = this.ageFromBirthDate(player.birthDate);
    const ageBonus =
      age == null ? 0 : age <= 23 ? 4 : age <= 28 ? 6 : age <= 32 ? 4 : 1;
    const heightBonus =
      typeof player.heightCm === 'number'
        ? player.position === 'GK'
          ? player.heightCm >= 190
            ? 4
            : 2
          : player.heightCm >= 180
            ? 2
            : 0
        : 0;
    const nameSeed = this.seedFromPlayer(player);
    const jitter = Math.floor(nameSeed * 7) - 3; // -3..+3 deterministic
    const positionalBase =
      player.position === 'GK'
        ? 68
        : player.position === 'DEF'
          ? 69
          : player.position === 'MID'
            ? 71
            : 72;
    return this.clamp(positionalBase + ageBonus + heightBonus + jitter);
  }

  adjustedBaseValue(rarity: CardRarityEnum, overall: number): number {
    const rawBase = this.baseValue(rarity);
    const floor = this.RARITY_FLOORS[rarity];
    const ceiling = this.RARITY_CEILINGS[rarity];
    const t = Math.max(0, Math.min(1, (overall - floor) / Math.max(1, ceiling - floor)));
    const multiplier = 0.8 + t * 0.4;
    return Math.max(1, Math.round(rawBase * multiplier));
  }

  private seedFromPlayer(player: Player): number {
    const input = `${player.provider ?? ''}:${player.providerPlayerId ?? ''}:${player.fullName ?? ''}`;
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return (hash % 1000) / 1000;
  }

  private ageFromBirthDate(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const date = new Date(birthDate);
    if (Number.isNaN(date.getTime())) return null;
    const diff = Date.now() - date.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }

  private clamp(value: number): number {
    return Math.max(1, Math.min(99, value));
  }
}
