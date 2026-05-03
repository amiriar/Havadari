import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { LeaderboardTypeEnum } from './constants/leaderboard.enums';
import { RankPointSourceEnum } from './constants/rank-point-source.enum';
import { LeaderboardReward } from './entities/leaderboard-reward.entity';
import { RankPointEvent } from './entities/rank-point-event.entity';

@Injectable()
export class LeaderboardService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(LeaderboardReward)
    private readonly rewardRepo: Repository<LeaderboardReward>,
    @InjectRepository(RankPointEvent)
    private readonly rankEventRepo: Repository<RankPointEvent>,
  ) {}

  async onModuleInit() {
    const existing = await this.rewardRepo.count();
    if (existing > 0) return;
    const defaults: Array<Partial<LeaderboardReward>> = [];
    for (const type of Object.values(LeaderboardTypeEnum)) {
      defaults.push(
        {
          type,
          rankFrom: 1,
          rankTo: 1,
          rewardFgc: 20000,
          rewardGems: 300,
          rewardChest: 'mythic x2',
        },
        {
          type,
          rankFrom: 2,
          rankTo: 3,
          rewardFgc: 10000,
          rewardGems: 150,
          rewardChest: 'legendary x2',
        },
        {
          type,
          rankFrom: 4,
          rankTo: 10,
          rewardFgc: 5000,
          rewardGems: 60,
          rewardChest: 'epic',
        },
        {
          type,
          rankFrom: 11,
          rankTo: 50,
          rewardFgc: 2000,
          rewardGems: 20,
          rewardChest: 'rare',
        },
        {
          type,
          rankFrom: 51,
          rankTo: 100,
          rewardFgc: 500,
          rewardGems: 5,
          rewardChest: null,
        },
      );
    }
    await this.rewardRepo.save(this.rewardRepo.create(defaults));
  }

  @Cron('0 0 0 * * 1')
  async resetClassicWeekly() {
    // Soft weekly reset for rank points with history logging.
    const users = await this.userRepo.find();
    const events: RankPointEvent[] = [];
    for (const user of users) {
      const before = user.rankPoints || 0;
      const after = Math.floor(before * 0.9);
      const delta = after - before;
      user.rankPoints = after;
      if (delta !== 0) {
        events.push(
          this.rankEventRepo.create({
            user,
            before,
            after,
            delta,
            source: RankPointSourceEnum.SEASON_RESET,
            refId: null,
            meta: { schedule: 'weekly_classic_soft_reset' },
          }),
        );
      }
    }
    await this.userRepo.save(users);
    if (events.length) await this.rankEventRepo.save(events);
  }

  async getLeaderboard(
    type: LeaderboardTypeEnum,
    page: number,
    limit: number,
    url?: string,
  ) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .leftJoin('user_cards', 'uc', 'uc."userId" = u.id')
      .leftJoin('cards', 'c', 'c.id = uc."cardId"')
      .select('u.id', 'userId')
      .addSelect('u."userName"', 'userName')
      .addSelect('u."fullName"', 'fullName')
      .addSelect('u."avatar"', 'avatar')
      .addSelect('u."rankPoints"', 'rankPoints')
      .groupBy('u.id');

    switch (type) {
      case LeaderboardTypeEnum.CLASSIC:
        qb.addSelect('u."rankPoints"', 'score').orderBy(
          'u."rankPoints"',
          'DESC',
        );
        break;
      case LeaderboardTypeEnum.CHAMPIONS:
        qb.addSelect('u."rankPoints"', 'score').orderBy(
          'u."rankPoints"',
          'DESC',
        );
        break;
      case LeaderboardTypeEnum.PREDICTION:
        qb.addSelect('0', 'score').orderBy('u."createdAt"', 'ASC');
        break;
      case LeaderboardTypeEnum.IRAN:
      default:
        qb.addSelect(
          '(u."rankPoints" + COALESCE(SUM(c."baseValue"),0)/100 + COUNT(uc.id)*5)',
          'score',
        ).orderBy('score', 'DESC');
        break;
    }

    const paged = await paginate(qb, {
      page,
      limit: Math.min(limit, 200),
      route: url,
    });

    const ranked = paged.items.map((row: any, idx: number) => ({
      rank: (page - 1) * Math.min(limit, 200) + idx + 1,
      userId: row.userId,
      userName: row.userName,
      fullName: row.fullName,
      avatar: row.avatar,
      score: Number(row.score || 0),
      rankPoints: Number(row.rankPoints || 0),
    }));

    return {
      ...paged,
      items: ranked,
      type,
      rewards: await this.getRewards(type),
    };
  }

  async getMyRank(user: User, type: LeaderboardTypeEnum) {
    const me = await this.mustUser(user);
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

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
