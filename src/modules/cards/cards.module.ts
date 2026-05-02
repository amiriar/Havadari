import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/auth/entities/user.entity';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { AvatarGenerationRun } from './entities/avatar-generation-run.entity';
import { Card } from './entities/card.entity';
import { UserCard } from './entities/user-card.entity';
import { CardsController } from './cards.controller';
import { UserCardsController } from './user-cards.controller';
import { UserSquadController } from './user-squad.controller';
import { CardAvatarService } from './services/card-avatar.service';
import { CardGenerationService } from './services/card-generation.service';
import { PlayerRatingService } from './services/player-rating.service';
import { UserCardService } from './services/user-card.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Card,
      AvatarGenerationRun,
      Player,
      PlayerStatSnapshot,
      UserCard,
      User,
    ]),
  ],
  controllers: [CardsController, UserCardsController, UserSquadController],
  providers: [
    CardGenerationService,
    PlayerRatingService,
    CardAvatarService,
    UserCardService,
  ],
  exports: [CardGenerationService],
})
export class CardsModule {}
