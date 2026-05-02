import { CardsModule } from '@app/cards/cards.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayerStatSnapshot } from './entities/player-stat-snapshot.entity';
import { PlayerSyncRun } from './entities/player-sync-run.entity';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { ApiFootballPlayerProvider } from './providers/api-football-player.provider';
import { FootballDataPlayerProvider } from './providers/football-data-player.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, PlayerStatSnapshot, PlayerSyncRun]),
    CardsModule,
  ],
  controllers: [PlayersController],
  providers: [
    PlayersService,
    ApiFootballPlayerProvider,
    FootballDataPlayerProvider,
  ],
  exports: [PlayersService],
})
export class PlayersModule {}

