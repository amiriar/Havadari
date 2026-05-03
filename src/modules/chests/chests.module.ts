import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { MissionsModule } from '@app/missions/missions.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChestsController } from './chests.controller';
import { ChestsService } from './chests.service';
import { ChestDefinitionEntity } from './entities/chest-definition.entity';
import { ChestOpenLog } from './entities/chest-open-log.entity';
import { UserChestState } from './entities/user-chest-state.entity';

@Module({
  imports: [
    LeaderboardModule,
    MissionsModule,
    TypeOrmModule.forFeature([
      User,
      Card,
      UserCard,
      UserChestState,
      ChestOpenLog,
      ChestDefinitionEntity,
    ]),
  ],
  controllers: [ChestsController],
  providers: [ChestsService],
  exports: [ChestsService],
})
export class ChestsModule {}
