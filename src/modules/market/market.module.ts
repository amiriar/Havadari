import { User } from '@app/auth/entities/user.entity';
import { AchievementsModule } from '@app/achievements/achievements.module';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { MissionsModule } from '@app/missions/missions.module';
import { ProgressionModule } from '@app/progression/progression.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketController } from './market.controller';
import { AdminMarketController } from './admin-market.controller';
import { MarketService } from './market.service';
import { MarketListing } from './entities/market-listing.entity';
import { MarketTrade } from './entities/market-trade.entity';
import { CardValueService } from './services/card-value.service';

@Module({
  imports: [
    LeaderboardModule,
    MissionsModule,
    ProgressionModule,
    AchievementsModule,
    TypeOrmModule.forFeature([
      User,
      Card,
      UserCard,
      MarketListing,
      MarketTrade,
    ]),
  ],
  controllers: [MarketController, AdminMarketController],
  providers: [MarketService, CardValueService],
  exports: [MarketService],
})
export class MarketModule {}
