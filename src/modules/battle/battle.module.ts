import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { UserChestInventory } from '@app/chests/entities/user-chest-inventory.entity';
import { ProgressionModule } from '@app/progression/progression.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { BattleRound } from './entities/battle-round.entity';
import { Battle } from './entities/battle.entity';
import { RankedSeason } from './entities/ranked-season.entity';
import { RankedSeasonSnapshot } from './entities/ranked-season-snapshot.entity';
import { ChampionsTournament } from './entities/champions-tournament.entity';
import { ChampionsParticipant } from './entities/champions-participant.entity';
import { ChampionsMatch } from './entities/champions-match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Card,
      UserCard,
      Battle,
      BattleRound,
      RankedSeason,
      RankedSeasonSnapshot,
      ChampionsTournament,
      ChampionsParticipant,
      ChampionsMatch,
      UserChestInventory,
    ]),
    ProgressionModule,
  ],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}
