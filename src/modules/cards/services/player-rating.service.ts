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
    if (overall >= 98) return CardRarityEnum.MYTHIC;
    if (overall >= 94) return CardRarityEnum.LEGENDARY;
    if (overall >= 88) return CardRarityEnum.EPIC;
    if (overall >= 80) return CardRarityEnum.RARE;
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

  private clamp(value: number): number {
    return Math.max(1, Math.min(99, value));
  }
}
