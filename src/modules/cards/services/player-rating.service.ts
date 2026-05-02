import { Injectable } from '@nestjs/common';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';

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
    const attack = this.clamp(40 + goals * 2 + assists + Math.floor(dribbles / 3) + activity);
    const defend = this.clamp(35 + tackles + interceptions + activity);
    const skill = this.clamp(45 + Math.floor(passes / 20) + Math.floor(dribbles / 2));
    const speed = this.clamp(45 + Math.floor(appearances / 2) + Math.floor(dribbles / 3));
    const power = this.clamp(45 + Math.floor((goals + tackles) / 2) + activity);

    const position = player.position || 'MID';
    const weighted =
      position === 'GK'
        ? speed * 0.1 + power * 0.2 + skill * 0.25 + attack * 0.05 + defend * 0.4
        : position === 'DEF'
          ? speed * 0.2 + power * 0.25 + skill * 0.15 + attack * 0.1 + defend * 0.3
          : position === 'MID'
            ? speed * 0.2 + power * 0.15 + skill * 0.3 + attack * 0.2 + defend * 0.15
            : speed * 0.25 + power * 0.2 + skill * 0.2 + attack * 0.3 + defend * 0.05;

    return {
      speed,
      power,
      skill,
      attack,
      defend,
      overall: this.clamp(Math.round(weighted)),
    };
  }

  rarity(overall: number): 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC' {
    if (overall >= 98) return 'MYTHIC';
    if (overall >= 94) return 'LEGENDARY';
    if (overall >= 88) return 'EPIC';
    if (overall >= 80) return 'RARE';
    return 'COMMON';
  }

  baseValue(rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'): number {
    switch (rarity) {
      case 'COMMON':
        return 100;
      case 'RARE':
        return 500;
      case 'EPIC':
        return 2000;
      case 'LEGENDARY':
        return 8000;
      case 'MYTHIC':
        return 30000;
    }
  }

  private clamp(value: number): number {
    return Math.max(1, Math.min(99, value));
  }
}

