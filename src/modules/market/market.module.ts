import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketListing } from './entities/market-listing.entity';
import { MarketTrade } from './entities/market-trade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserCard, MarketListing, MarketTrade])],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}

