import { User } from '@app/auth/entities/user.entity';
import { AchievementsModule } from '@app/achievements/achievements.module';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { ProgressionModule } from '@app/progression/progression.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionClaimLog } from './entities/mission-claim-log.entity';
import { MissionDefinition } from './entities/mission-definition.entity';
import { UserMissionProgress } from './entities/user-mission-progress.entity';
import { MissionsController } from './missions.controller';
import { MissionsService } from './missions.service';

@Module({
  imports: [
    LeaderboardModule,
    ProgressionModule,
    AchievementsModule,
    TypeOrmModule.forFeature([
      User,
      MissionDefinition,
      UserMissionProgress,
      MissionClaimLog,
    ]),
  ],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}
