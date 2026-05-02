import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { MarketListing } from '../entities/market-listing.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketListing, UserCard, GameProfile, Card]),
  ],
  controllers: [MarketController],
  providers: [MarketService, GameBootstrapService],
})
export class MarketModule {}
