import { User } from '@app/auth/entities/user.entity';
import { AchievementMetricEnum } from '@app/achievements/constants/achievement.enums';
import { AchievementsService } from '@app/achievements/achievements.service';
import { RankPointSourceEnum } from '@app/leaderboard/constants/rank-point-source.enum';
import { RankPointsService } from '@app/leaderboard/rank-points.service';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissionMetricEnum, MissionTypeEnum } from './constants/mission.enums';
import { MissionClaimLog } from './entities/mission-claim-log.entity';
import { MissionDefinition } from './entities/mission-definition.entity';
import { UserMissionProgress } from './entities/user-mission-progress.entity';

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(MissionDefinition)
    private readonly missionRepo: Repository<MissionDefinition>,
    @InjectRepository(UserMissionProgress)
    private readonly progressRepo: Repository<UserMissionProgress>,
    @InjectRepository(MissionClaimLog)
    private readonly claimLogRepo: Repository<MissionClaimLog>,
    private readonly rankPointsService: RankPointsService,
    private readonly progressionService: ProgressionService,
    private readonly achievementsService: AchievementsService,
  ) {}

  // Keep slight delay after midnight to avoid boundary collisions.
  @Cron('0 5 0 * * *')
  async cleanupDailyProgress() {
    const today = this.getDailyKey();
    await this.progressRepo
      .createQueryBuilder()
      .delete()
      .where(`"periodKey" LIKE 'daily:%'`)
      .andWhere(`"periodKey" != :today`, { today })
      .execute();
  }

  // Iran week ends on Friday, so weekly cleanup runs at start of Saturday.
  @Cron('0 10 0 * * 6')
  async cleanupWeeklyProgress() {
    const week = this.getWeeklyKey();
    await this.progressRepo
      .createQueryBuilder()
      .delete()
      .where(`"periodKey" LIKE 'weekly:%'`)
      .andWhere(`"periodKey" != :week`, { week })
      .execute();
  }

  async list(userId: string) {
    const me = await this.getUserByIdOrFail(userId);
    const defs = await this.missionRepo.find({
      where: { isActive: true },
      order: { type: 'ASC', createdAt: 'ASC' },
    });

    const items = [];
    for (const mission of defs) {
      const periodKey = this.getPeriodKey(mission.type);
      let progress = await this.progressRepo.findOne({
        where: {
          user: { id: me.id },
          mission: { id: mission.id },
          periodKey,
        },
      });
      if (!progress) {
        progress = await this.progressRepo.save(
          this.progressRepo.create({
            user: me,
            mission,
            periodKey,
            progressValue: 0,
            isCompleted: false,
            completedAt: null,
            claimedAt: null,
          }),
        );
      }
      items.push({
        missionId: mission.id,
        code: mission.code,
        title: mission.title,
        description: mission.description,
        type: mission.type,
        metric: mission.metric,
        targetValue: mission.targetValue,
        progressValue: progress.progressValue,
        isCompleted: progress.isCompleted,
        isClaimed: Boolean(progress.claimedAt),
        reward: {
          fgc: mission.rewardFgc,
          gems: mission.rewardGems,
          rankPoints: mission.rewardRankPoints,
        },
      });
    }
    return items;
  }

  async track(userId: string, metric: MissionMetricEnum, value = 1) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { tracked: 0 };
    const defs = await this.missionRepo.find({
      where: { isActive: true, metric },
    });
    let tracked = 0;
    for (const mission of defs) {
      const periodKey = this.getPeriodKey(mission.type);
      let progress = await this.progressRepo.findOne({
        where: {
          user: { id: user.id },
          mission: { id: mission.id },
          periodKey,
        },
      });
      if (!progress) {
        progress = this.progressRepo.create({
          user,
          mission,
          periodKey,
          progressValue: 0,
          isCompleted: false,
          completedAt: null,
          claimedAt: null,
        });
      }
      if (progress.isCompleted) continue;
      progress.progressValue = Math.min(
        mission.targetValue,
        progress.progressValue + value,
      );
      if (progress.progressValue >= mission.targetValue) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      }
      await this.progressRepo.save(progress);
      tracked += 1;
    }
    return { tracked };
  }

  async claim(userId: string, missionId: string) {
    const me = await this.getUserByIdOrFail(userId);
    const mission = await this.missionRepo.findOne({
      where: { id: missionId, isActive: true },
    });
    if (!mission) throw new BadRequestException('Mission not found.');

    const periodKey = this.getPeriodKey(mission.type);
    const progress = await this.progressRepo.findOne({
      where: { user: { id: me.id }, mission: { id: mission.id }, periodKey },
    });
    if (!progress || !progress.isCompleted) {
      throw new BadRequestException('Mission not completed yet.');
    }
    if (progress.claimedAt) {
      throw new BadRequestException('Mission already claimed.');
    }

    me.fgc += mission.rewardFgc;
    me.gems += mission.rewardGems;
    await this.userRepo.save(me);
    if (mission.rewardRankPoints > 0) {
      await this.rankPointsService.apply(
        me.id,
        mission.rewardRankPoints,
        RankPointSourceEnum.REWARD,
        mission.id,
        { source: 'mission_claim', missionCode: mission.code },
      );
    }
    progress.claimedAt = new Date();
    await this.progressRepo.save(progress);

    await this.claimLogRepo.save(
      this.claimLogRepo.create({
        user: me,
        mission,
        periodKey,
        rewardFgc: mission.rewardFgc,
        rewardGems: mission.rewardGems,
        rewardRankPoints: mission.rewardRankPoints,
      }),
    );
    await this.progressionService.addExp(me.id, 30);
    await this.progressionService.addTrophies(me.id, 2);
    if (mission.metric === MissionMetricEnum.OPEN_CHESTS) {
      await this.achievementsService.track(
        me.id,
        AchievementMetricEnum.OPEN_CHESTS,
        mission.targetValue,
      );
    } else if (mission.metric === MissionMetricEnum.SELL_CARDS) {
      await this.achievementsService.track(
        me.id,
        AchievementMetricEnum.SELL_CARDS,
        mission.targetValue,
      );
    } else if (mission.metric === MissionMetricEnum.BUY_CARDS) {
      await this.achievementsService.track(
        me.id,
        AchievementMetricEnum.BUY_CARDS,
        mission.targetValue,
      );
    }

    return {
      missionId: mission.id,
      claimed: true,
      reward: {
        fgc: mission.rewardFgc,
        gems: mission.rewardGems,
        rankPoints: mission.rewardRankPoints,
      },
      balances: {
        fgc: me.fgc,
        gems: me.gems,
      },
    };
  }

  private getPeriodKey(type: MissionTypeEnum) {
    return type === MissionTypeEnum.DAILY
      ? this.getDailyKey()
      : this.getWeeklyKey();
  }

  private getDailyKey() {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `daily:${y}-${m}-${day}`;
  }

  private getWeeklyKey() {
    const d = new Date();
    const firstDay = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const dayMs = 24 * 60 * 60 * 1000;
    const dayOfYear =
      Math.floor((d.getTime() - firstDay.getTime()) / dayMs) + 1;
    const week = Math.ceil(dayOfYear / 7);
    return `weekly:${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: userId } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
