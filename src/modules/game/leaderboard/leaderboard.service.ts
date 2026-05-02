import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProfile } from '../entities/game-profile.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
  ) {}

  async getLeaderboard(type: string, region?: string) {
    const profiles = await this.profileRepo.find({
      relations: ['user'],
      order: { trophies: 'DESC', updatedAt: 'DESC' },
      take: 100,
    });

    return {
      type,
      region: region || 'GLOBAL',
      items: profiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.user.id,
        username: profile.user.userName,
        trophies: profile.trophies,
        fgc: profile.fgc,
        gems: profile.gems,
      })),
    };
  }
}
