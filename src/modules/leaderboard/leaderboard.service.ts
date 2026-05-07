import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { LeaderboardTypeEnum } from './constants/leaderboard.enums';
import { RankPointSourceEnum } from './constants/rank-point-source.enum';
import { LeaderboardReward } from './entities/leaderboard-reward.entity';
import { RankPointsService } from './rank-points.service';
import { AdminUpsertLeaderboardRewardDto } from './dto/admin-upsert-leaderboard-reward.dto';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(LeaderboardReward)
    private readonly rewardRepo: Repository<LeaderboardReward>,
    private readonly rankPointsService: RankPointsService,
  ) {}

  // Iran week ends on Friday, so weekly reset runs at start of Saturday.
  @Cron('0 0 0 * * 6')
  async resetClassicWeekly() {
    // Soft weekly reset for rank points with history logging.
    const users = await this.userRepo.find();
    for (const user of users) {
      const before = user.rankPoints || 0;
      const after = Math.floor(before * 0.9);
      if (after !== before) {
        await this.rankPointsService.apply(
          user.id,
          after - before,
          RankPointSourceEnum.SEASON_RESET,
          null,
          { schedule: 'weekly_classic_soft_reset' },
        );
      }
    }
  }

  async getLeaderboard(
    type: LeaderboardTypeEnum,
    page: number,
    limit: number,
    url?: string,
  ) {
    const order =
      type === LeaderboardTypeEnum.PREDICTION
        ? ({ createdAt: 'ASC' } as const)
        : type === LeaderboardTypeEnum.TROPHIES
          ? ({ trophies: 'DESC' } as const)
          : ({ rankPoints: 'DESC' } as const);

    const paged = await paginate(
      this.userRepo,
      {
        page,
        limit: Math.min(limit, 200),
        route: url,
      },
      { order },
    );

    const ranked = paged.items.map((row: User, idx: number) => ({
      rank: (page - 1) * Math.min(limit, 200) + idx + 1,
      userId: row.id,
      userName: row.userName,
      fullName: row.fullName,
      avatar: row.avatar,
      score:
        type === LeaderboardTypeEnum.PREDICTION
          ? 0
          : type === LeaderboardTypeEnum.TROPHIES
            ? Number(row.trophies || 0)
            : Number(row.rankPoints || 0),
      rankPoints: Number(row.rankPoints || 0),
      trophies: Number(row.trophies || 0),
    }));

    return {
      ...paged,
      items: ranked,
      type,
      rewards: await this.getRewards(type),
    };
  }

  async getMyRank(userId: string, type: LeaderboardTypeEnum) {
    const me = await this.getUserByIdOrFail(userId);
    const top = await this.getLeaderboard(type, 1, 10000);
    const row = top.items.find((x: any) => x.userId === me.id);
    return (
      row || {
        rank: null,
        userId: me.id,
        score: 0,
      }
    );
  }

  async adminListRewards(type?: LeaderboardTypeEnum) {
    return this.rewardRepo.find({
      where: type ? { type } : {},
      order: { type: 'ASC', rankFrom: 'ASC' },
    });
  }

  async adminUpsertReward(dto: AdminUpsertLeaderboardRewardDto) {
    const existing = await this.rewardRepo.findOne({
      where: {
        type: dto.type,
        rankFrom: dto.rankFrom,
        rankTo: dto.rankTo,
      },
    });
    const entity = existing || this.rewardRepo.create();
    entity.type = dto.type;
    entity.rankFrom = dto.rankFrom;
    entity.rankTo = dto.rankTo;
    entity.rewardFgc = dto.rewardFgc;
    entity.rewardGems = dto.rewardGems;
    entity.rewardChest = dto.rewardChest ?? null;
    return this.rewardRepo.save(entity);
  }

  async adminDeleteReward(id: string) {
    await this.rewardRepo.delete({ id });
    return { deleted: true, id };
  }

  private async getRewards(type: LeaderboardTypeEnum) {
    const rows = await this.rewardRepo.find({
      where: { type },
      order: { rankFrom: 'ASC' },
    });
    return rows.map((row) => ({
      rankFrom: row.rankFrom,
      rankTo: row.rankTo,
      reward: {
        FGC: row.rewardFgc,
        gem: row.rewardGems,
        chest: row.rewardChest,
      },
    }));
  }

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: userId } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
