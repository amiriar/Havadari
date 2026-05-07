import { User } from '@app/auth/entities/user.entity';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { AchievementMetricEnum } from './constants/achievement.enums';
import { AchievementClaimLog } from './entities/achievement-claim-log.entity';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { UserAchievementProgress } from './entities/user-achievement-progress.entity';
import { AdminUpsertAchievementDto } from './dto/admin-upsert-achievement.dto';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(AchievementDefinition)
    private readonly definitionRepo: Repository<AchievementDefinition>,
    @InjectRepository(UserAchievementProgress)
    private readonly progressRepo: Repository<UserAchievementProgress>,
    @InjectRepository(AchievementClaimLog)
    private readonly claimLogRepo: Repository<AchievementClaimLog>,
    private readonly progressionService: ProgressionService,
  ) {}

  async list(userId: string) {
    const me = await this.getUserByIdOrFail(userId);
    const defs = await this.definitionRepo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    const items = [];
    for (const def of defs) {
      let progress = await this.progressRepo.findOne({
        where: { user: { id: me.id }, achievement: { id: def.id } },
      });
      if (!progress) {
        progress = await this.progressRepo.save(
          this.progressRepo.create({
            user: me,
            achievement: def,
            progressValue: 0,
            isCompleted: false,
            completedAt: null,
            claimedAt: null,
          }),
        );
      }
      items.push({
        achievementId: def.id,
        code: def.code,
        title: def.title,
        description: def.description,
        metric: def.metric,
        targetValue: def.targetValue,
        progressValue: progress.progressValue,
        isCompleted: progress.isCompleted,
        isClaimed: Boolean(progress.claimedAt),
        reward: {
          fgc: def.rewardFgc,
          gems: def.rewardGems,
          trophies: def.rewardTrophies,
          exp: def.rewardExp,
        },
      });
    }
    return items;
  }

  async track(userId: string, metric: AchievementMetricEnum, value = 1) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return { tracked: 0 };

    const defs = await this.definitionRepo.find({
      where: { isActive: true, metric },
    });
    let tracked = 0;
    for (const def of defs) {
      let progress = await this.progressRepo.findOne({
        where: { user: { id: user.id }, achievement: { id: def.id } },
      });
      if (!progress) {
        progress = this.progressRepo.create({
          user,
          achievement: def,
          progressValue: 0,
          isCompleted: false,
          completedAt: null,
          claimedAt: null,
        });
      }
      if (progress.isCompleted) continue;
      progress.progressValue = Math.min(
        def.targetValue,
        progress.progressValue + value,
      );
      if (progress.progressValue >= def.targetValue) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
      }
      await this.progressRepo.save(progress);
      tracked += 1;
    }
    return { tracked };
  }

  async claim(userId: string, achievementId: string) {
    const me = await this.getUserByIdOrFail(userId);
    const def = await this.definitionRepo.findOne({
      where: { id: achievementId, isActive: true },
    });
    if (!def) throw new BadRequestException('Achievement not found.');
    const progress = await this.progressRepo.findOne({
      where: { user: { id: me.id }, achievement: { id: def.id } },
    });
    if (!progress || !progress.isCompleted) {
      throw new BadRequestException('Achievement not completed yet.');
    }
    if (progress.claimedAt) {
      throw new BadRequestException('Achievement already claimed.');
    }

    me.fgc += def.rewardFgc;
    me.gems += def.rewardGems;
    await this.userRepo.save(me);
    if (def.rewardTrophies) {
      await this.progressionService.addTrophies(me.id, def.rewardTrophies);
    }
    if (def.rewardExp) {
      await this.progressionService.addExp(me.id, def.rewardExp);
    }

    progress.claimedAt = new Date();
    await this.progressRepo.save(progress);
    await this.claimLogRepo.save(
      this.claimLogRepo.create({
        user: me,
        achievement: def,
        rewardFgc: def.rewardFgc,
        rewardGems: def.rewardGems,
        rewardTrophies: def.rewardTrophies,
        rewardExp: def.rewardExp,
      }),
    );

    const updated = await this.userRepo.findOne({ where: { id: me.id } });
    return {
      achievementId: def.id,
      claimed: true,
      reward: {
        fgc: def.rewardFgc,
        gems: def.rewardGems,
        trophies: def.rewardTrophies,
        exp: def.rewardExp,
      },
      balances: {
        fgc: updated?.fgc ?? me.fgc,
        gems: updated?.gems ?? me.gems,
        trophies: updated?.trophies ?? 0,
        level: updated?.level ?? 1,
        exp: updated?.exp ?? 0,
      },
    };
  }

  async adminListDefinitions() {
    return this.definitionRepo.find({ order: { createdAt: 'ASC' } });
  }

  async adminUpsertDefinition(dto: AdminUpsertAchievementDto) {
    const existing = await this.definitionRepo.findOne({
      where: { code: dto.code },
    });
    const row = existing || this.definitionRepo.create();
    row.code = dto.code;
    row.title = dto.title;
    row.description = dto.description ?? null;
    row.metric = dto.metric;
    row.targetValue = dto.targetValue;
    row.rewardFgc = dto.rewardFgc ?? 0;
    row.rewardGems = dto.rewardGems ?? 0;
    row.rewardTrophies = dto.rewardTrophies ?? 0;
    row.rewardExp = dto.rewardExp ?? 0;
    row.isActive = dto.isActive ?? true;
    return this.definitionRepo.save(row);
  }

  async adminDeleteDefinition(id: string) {
    await this.definitionRepo.delete({ id });
    return { deleted: true, id };
  }

  async adminProgress(page = 1, limit = 20, userId?: string, url?: string) {
    return paginate(
      this.progressRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: userId ? { user: { id: userId } } : {},
        relations: { user: true, achievement: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  async adminClaimLogs(page = 1, limit = 20, userId?: string, url?: string) {
    return paginate(
      this.claimLogRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: userId ? { user: { id: userId } } : {},
        relations: { user: true, achievement: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  private async getUserByIdOrFail(userId?: string) {
    if (!userId) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: userId } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
