import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardReward } from './entities/leaderboard-reward.entity';
import { RankPointEvent } from './entities/rank-point-event.entity';
import { LeaderboardService } from './leaderboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserCard,
      LeaderboardReward,
      RankPointEvent,
    ]),
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
