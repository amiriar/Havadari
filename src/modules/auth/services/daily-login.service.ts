import { User } from '@app/auth/entities/user.entity';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { DataSource, Repository } from 'typeorm';
import { DailyLoginClaim } from '../entities/daily-login-claim.entity';
import { DailyLoginRewardConfig } from '../entities/daily-login-reward-config.entity';

@Injectable()
export class DailyLoginService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DailyLoginClaim)
    private readonly claimRepo: Repository<DailyLoginClaim>,
    @InjectRepository(DailyLoginRewardConfig)
    private readonly rewardConfigRepo: Repository<DailyLoginRewardConfig>,
  ) {}

  async status(user: User) {
    const me = await this.mustUser(user);
    const todayDate = this.toUtcDateOnly(new Date());
    const todayClaim = await this.claimRepo.findOne({
      where: { user: { id: me.id }, claimDate: todayDate },
    });
    const streak = me.loginStreak || 0;
    const cycleLength = await this.getCycleLength();
    const rewardDay = this.getRewardDay(streak === 0 ? 1 : streak, cycleLength);
    const todayReward = await this.rewardConfigRepo.findOne({
      where: { day: rewardDay },
    });

    return {
      claimedToday: Boolean(todayClaim),
      streak,
      todayReward: {
        fgc: Number(todayReward?.rewardFgc || 0),
        gems: Number(todayReward?.rewardGems || 0),
      },
      lastLoginDate: me.lastLoginDate,
    };
  }

  async claim(user: User) {
    const me = await this.mustUser(user);
    return this.claimDailyReward(me.id);
  }

  async history(user: User, page = 1, limit = 20, url?: string) {
    const me = await this.mustUser(user);
    return paginate(
      this.claimRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: { user: { id: me.id } },
        order: { claimedAt: 'DESC' },
      },
    );
  }

  async claimDailyReward(userId: string) {
    const today = this.toUtcDateOnly(new Date());
    const yesterday = this.toUtcDateOnly(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager
          .getRepository(User)
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: userId })
          .getOne();

        if (!user) {
          throw new UnauthorizedException('User not found.');
        }

        const existing = await manager.getRepository(DailyLoginClaim).findOne({
          where: { user: { id: userId }, claimDate: today },
        });
        if (existing) {
          throw new BadRequestException('Already claimed');
        }

        const streak =
          user.lastLoginDate === yesterday ? (user.loginStreak || 0) + 1 : 1;

        const cycleLength = await manager
          .getRepository(DailyLoginRewardConfig)
          .count();
        if (cycleLength <= 0) {
          throw new BadRequestException('Daily login reward config is empty.');
        }
        const rewardDay = this.getRewardDay(streak, cycleLength);
        const reward = await manager
          .getRepository(DailyLoginRewardConfig)
          .findOne({
            where: { day: rewardDay },
          });
        if (!reward) {
          throw new BadRequestException(
            'Daily login reward config is invalid.',
          );
        }

        await manager.getRepository(DailyLoginClaim).insert({
          user: { id: userId } as User,
          claimDate: today,
          claimedAt: new Date(),
          rewardFgc: reward.rewardFgc,
          rewardGems: reward.rewardGems,
        });

        user.loginStreak = streak;
        user.lastLoginDate = today;
        user.fgc = Number(user.fgc || 0) + Number(reward.rewardFgc || 0);
        user.gems = Number(user.gems || 0) + Number(reward.rewardGems || 0);
        await manager.getRepository(User).save(user);

        return {
          streak,
          reward: {
            fgc: reward.rewardFgc,
            gems: reward.rewardGems,
          },
        };
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException('Already claimed');
      }
      throw error;
    }
  }

  private toUtcDateOnly(date: Date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private getRewardDay(streak: number, cycleLength: number) {
    return ((Math.max(streak, 1) - 1) % cycleLength) + 1;
  }

  private async getCycleLength() {
    return this.rewardConfigRepo.count();
  }

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
