import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { ChestOpening } from '../entities/chest-opening.entity';
import { GemPurchase } from '../entities/gem-purchase.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { ChestsController } from './chests.controller';
import { ChestsService } from './chests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameProfile,
      Card,
      UserCard,
      ChestOpening,
      GemPurchase,
    ]),
  ],
  controllers: [ChestsController],
  providers: [ChestsService, GameBootstrapService],
})
export class ChestsModule {}
