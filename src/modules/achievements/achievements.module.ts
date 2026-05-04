import { User } from '@app/auth/entities/user.entity';
import { ProgressionModule } from '@app/progression/progression.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementClaimLog } from './entities/achievement-claim-log.entity';
import { AchievementDefinition } from './entities/achievement-definition.entity';
import { UserAchievementProgress } from './entities/user-achievement-progress.entity';

@Module({
  imports: [
    ProgressionModule,
    TypeOrmModule.forFeature([
      User,
      AchievementDefinition,
      UserAchievementProgress,
      AchievementClaimLog,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
