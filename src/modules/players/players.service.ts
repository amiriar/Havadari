import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CardGenerationService } from '@app/cards/services/card-generation.service';
import { Player } from './entities/player.entity';
import { PlayerStatSnapshot } from './entities/player-stat-snapshot.entity';
import { PlayerSyncRun } from './entities/player-sync-run.entity';
import { ApiFootballPlayerProvider } from './providers/api-football-player.provider';
import { FootballDataPlayerProvider } from './providers/football-data-player.provider';
import {
  PlayerProvider,
  ProviderPlayer,
  ProviderPlayerStats,
} from './providers/player-provider.interface';

type ProviderDiagnostic = {
  provider: string;
  playersFetched: number;
  statsFetched: number;
  importedPlayers: number;
  importedStats: number;
  status: 'ok' | 'failed';
  error?: string;
};

@Injectable()
export class PlayersService {
  private readonly logger = new Logger(PlayersService.name);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerStatSnapshot)
    private readonly statRepo: Repository<PlayerStatSnapshot>,
    @InjectRepository(PlayerSyncRun)
    private readonly runRepo: Repository<PlayerSyncRun>,
    private readonly footballDataProvider: FootballDataPlayerProvider,
    private readonly apiFootballProvider: ApiFootballPlayerProvider,
    private readonly cardGenerationService: CardGenerationService,
  ) {}

  @Cron('0 0 */12 * * *')
  async syncEvery12Hours() {
    const defaultLeagues = ['1', '39', '140', '135', '78', '61'];
    await this.syncNow(2026, defaultLeagues);
  }

  async syncNow(season = 2026, competitions?: string[]) {
    const providers: PlayerProvider[] = [
      this.footballDataProvider,
      this.apiFootballProvider,
    ];

    let totalImportedPlayers = 0;
    let totalImportedStats = 0;
    const diagnostics: ProviderDiagnostic[] = [];

    for (const provider of providers) {
      try {
        const players = await provider.fetchPlayers(season, competitions);
        const importedPlayers = await this.upsertPlayers(provider, players);
        const stats = await provider.fetchPlayerStats(season, competitions);
        const importedStats = await this.upsertStats(provider, season, stats);

        totalImportedPlayers += importedPlayers;
        totalImportedStats += importedStats;
        diagnostics.push({
          provider: provider.name,
          playersFetched: players.length,
          statsFetched: stats.length,
          importedPlayers,
          importedStats,
          status: 'ok',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        diagnostics.push({
          provider: provider.name,
          playersFetched: 0,
          statsFetched: 0,
          importedPlayers: 0,
          importedStats: 0,
          status: 'failed',
          error: message,
        });
        this.logger.warn(`Provider ${provider.name} failed: ${message}`);
      }
    }

    if (totalImportedPlayers === 0) {
      const failedRun = this.runRepo.create({
        season,
        status: 'FAILED',
        importedPlayers: 0,
        importedStats: 0,
        diagnostics,
        message: 'No players imported',
      });
      await this.runRepo.save(failedRun);
      throw new BadRequestException({
        message:
          'No players were imported. Check provider keys, coverage, or competition list.',
        season,
        diagnostics,
      });
    }

    const generatedCards = await this.cardGenerationService.generateFromPlayers(season);

    const successRun = this.runRepo.create({
      season,
      status: 'SUCCESS',
      importedPlayers: totalImportedPlayers,
      importedStats: totalImportedStats,
      diagnostics,
      message: null,
    });
    await this.runRepo.save(successRun);

    return {
      season,
      importedPlayers: totalImportedPlayers,
      importedStats: totalImportedStats,
      diagnostics,
      generatedCards,
    };
  }

  async list(filters?: {
    team?: string;
    position?: string;
    competitionCode?: string;
    q?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.team) where.teamName = ILike(`%${filters.team}%`);
    if (filters?.position) where.position = filters.position as any;
    if (filters?.competitionCode) where.competitionCode = filters.competitionCode;
    if (filters?.q) where.fullName = ILike(`%${filters.q}%`);

    return this.playerRepo.find({
      where,
      order: { fullName: 'ASC' },
      take: Math.min(filters?.limit || 500, 5000),
    });
  }

  async stats(playerId: string) {
    return this.statRepo.find({
      where: { player: { id: playerId } },
      order: { season: 'DESC' },
    });
  }

  async syncHistory(limit = 20) {
    return this.runRepo.find({
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 200),
    });
  }

  private async upsertPlayers(provider: PlayerProvider, rows: ProviderPlayer[]) {
    let imported = 0;
    for (const row of rows) {
      const existing = await this.playerRepo.findOne({
        where: {
          provider: provider.name,
          providerPlayerId: row.providerPlayerId,
        },
      });
      if (!existing) {
        await this.playerRepo.save(this.playerRepo.create(row));
      } else {
        existing.fullName = row.fullName;
        existing.nationality = row.nationality;
        existing.teamName = row.teamName;
        existing.competitionCode = row.competitionCode;
        existing.position = row.position;
        existing.birthDate = row.birthDate;
        existing.heightCm = row.heightCm;
        existing.weightKg = row.weightKg;
        existing.rawPayload = row.rawPayload;
        await this.playerRepo.save(existing);
      }
      imported += 1;
    }
    return imported;
  }

  private async upsertStats(
    provider: PlayerProvider,
    season: number,
    rows: ProviderPlayerStats[],
  ) {
    let imported = 0;
    for (const row of rows) {
      const player = await this.playerRepo.findOne({
        where: {
          provider: provider.name,
          providerPlayerId: row.providerPlayerId,
        },
      });
      if (!player) continue;

      const existing = await this.statRepo.findOne({
        where: { player: { id: player.id }, season },
      });
      if (!existing) {
        await this.statRepo.save(
          this.statRepo.create({
            player,
            season,
            appearances: row.appearances,
            minutes: row.minutes,
            goals: row.goals,
            assists: row.assists,
            shots: row.shots,
            passes: row.passes,
            tackles: row.tackles,
            interceptions: row.interceptions,
            dribbles: row.dribbles,
            yellowCards: row.yellowCards,
            redCards: row.redCards,
            rating: row.rating,
            rawPayload: row.rawPayload,
          }),
        );
      } else {
        Object.assign(existing, {
          appearances: row.appearances,
          minutes: row.minutes,
          goals: row.goals,
          assists: row.assists,
          shots: row.shots,
          passes: row.passes,
          tackles: row.tackles,
          interceptions: row.interceptions,
          dribbles: row.dribbles,
          yellowCards: row.yellowCards,
          redCards: row.redCards,
          rating: row.rating,
          rawPayload: row.rawPayload,
        });
        await this.statRepo.save(existing);
      }
      imported += 1;
    }
    return imported;
  }
}
