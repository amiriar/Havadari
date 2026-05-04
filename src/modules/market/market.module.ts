import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { MissionsModule } from '@app/missions/missions.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketListing } from './entities/market-listing.entity';
import { MarketTrade } from './entities/market-trade.entity';
import { CardValueService } from './services/card-value.service';

@Module({
  imports: [
    LeaderboardModule,
    MissionsModule,
    TypeOrmModule.forFeature([
      User,
      Card,
      UserCard,
      MarketListing,
      MarketTrade,
    ]),
  ],
  controllers: [MarketController],
  providers: [MarketService, CardValueService],
  exports: [MarketService],
})
export class MarketModule {}
