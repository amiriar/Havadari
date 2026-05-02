import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchSyncRun } from './entities/match-sync-run.entity';
import { WorldCupMatch } from './entities/world-cup-match.entity';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { ApiFootballProvider } from './providers/api-football.provider';
import { FootballDataProvider } from './providers/football-data.provider';

@Module({
  imports: [TypeOrmModule.forFeature([WorldCupMatch, MatchSyncRun])],
  controllers: [MatchController],
  providers: [MatchService, FootballDataProvider, ApiFootballProvider],
  exports: [MatchService],
})
export class MatchModule {}
