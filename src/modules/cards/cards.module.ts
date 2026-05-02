import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { AvatarGenerationRun } from './entities/avatar-generation-run.entity';
import { Card } from './entities/card.entity';
import { CardsController } from './cards.controller';
import { CardAvatarService } from './services/card-avatar.service';
import { CardGenerationService } from './services/card-generation.service';
import { PlayerRatingService } from './services/player-rating.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Card,
      AvatarGenerationRun,
      Player,
      PlayerStatSnapshot,
    ]),
  ],
  controllers: [CardsController],
  providers: [CardGenerationService, PlayerRatingService, CardAvatarService],
  exports: [CardGenerationService],
})
export class CardsModule {}

