import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsModule } from '@app/achievements/achievements.module';
import { User } from '@app/auth/entities/user.entity';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { ProgressionModule } from '@app/progression/progression.module';
import { AvatarGenerationRun } from './entities/avatar-generation-run.entity';
import { Card } from './entities/card.entity';
import { UserCard } from './entities/user-card.entity';
import { CardsController } from './cards.controller';
import { AdminCardsController } from './admin-cards.controller';
import { UserCardsController } from './user-cards.controller';
import { UserSquadController } from './user-squad.controller';
import { CardAvatarService } from './services/card-avatar.service';
import { CardGenerationService } from './services/card-generation.service';
import { GapgptImageService } from './services/gapgpt-image.service';
import { PlayerRatingService } from './services/player-rating.service';
import { UserCardService } from './services/user-card.service';

@Module({
  imports: [
    ProgressionModule,
    AchievementsModule,
    TypeOrmModule.forFeature([
      Card,
      AvatarGenerationRun,
      Player,
      PlayerStatSnapshot,
      UserCard,
      User,
    ]),
  ],
  controllers: [
    CardsController,
    UserCardsController,
    UserSquadController,
    AdminCardsController,
  ],
  providers: [
    CardGenerationService,
    PlayerRatingService,
    GapgptImageService,
    CardAvatarService,
    UserCardService,
  ],
  exports: [CardGenerationService, UserCardService],
})
export class CardsModule {}
