import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Card, UserCard, GameProfile])],
  controllers: [CardsController],
  providers: [CardsService, GameBootstrapService],
  exports: [CardsService],
})
export class CardsModule {}
