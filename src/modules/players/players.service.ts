import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { CardGenerationService } from '@app/cards/services/card-generation.service';
import { ProviderDiagnostic } from './constants/player-sync.types';
import {
  PlayerPositionEnum,
  PlayerProviderEnum,
  PlayerSyncRunStatusEnum,
} from './constants/player.enums';
import { ManualImportPlayersDto } from './dto/manual-import.dto';
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
        const importedPlayers = await this.upsertPlayers(
          provider.name,
          players,
        );
        const stats = await provider.fetchPlayerStats(season, competitions);
        const importedStats = await this.upsertStats(
          provider.name,
          season,
          stats,
        );

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
        status: PlayerSyncRunStatusEnum.FAILED,
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

    const generatedCards =
      await this.cardGenerationService.generateFromPlayers(season);

    const successRun = this.runRepo.create({
      season,
      status: PlayerSyncRunStatusEnum.SUCCESS,
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

  async importManual(dto: ManualImportPlayersDto) {
    const season = dto.season ?? 2026;
    const importedPlayers = await this.upsertPlayers(
      PlayerProviderEnum.MANUAL,
      dto.players as any,
    );
    const importedStats = await this.upsertStats(
      PlayerProviderEnum.MANUAL,
      season,
      (dto.stats || []).map((row) => ({
        providerPlayerId: row.providerPlayerId,
        season: row.season ?? season,
        appearances: row.appearances || 0,
        minutes: row.minutes || 0,
        goals: row.goals || 0,
        assists: row.assists || 0,
        shots: row.shots || 0,
        passes: row.passes || 0,
        tackles: row.tackles || 0,
        interceptions: row.interceptions || 0,
        dribbles: row.dribbles || 0,
        yellowCards: row.yellowCards || 0,
        redCards: row.redCards || 0,
        rating: null,
        rawPayload: row as any,
      })),
    );
    const generatedCards =
      await this.cardGenerationService.generateFromPlayers(season);

    const run = this.runRepo.create({
      season,
      status: PlayerSyncRunStatusEnum.SUCCESS,
      importedPlayers,
      importedStats,
      diagnostics: [
        {
          provider: PlayerProviderEnum.MANUAL,
          playersFetched: dto.players.length,
          statsFetched: dto.stats?.length || 0,
          importedPlayers,
          importedStats,
          status: 'ok',
        },
      ],
      message: 'manual import',
    });
    await this.runRepo.save(run);

    return { season, importedPlayers, importedStats, generatedCards };
  }

  async seedBasic(season = 2026) {
    const now = new Date().toISOString();
    const players = [
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-messi',
        fullName: 'Lionel Messi',
        nationality: 'Argentina',
        teamName: 'Inter Miami',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.FW,
        birthDate: '1987-06-24',
        heightCm: 170,
        weightKg: 72,
        rawPayload: { seededAt: now },
      },
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-mbappe',
        fullName: 'Kylian Mbappe',
        nationality: 'France',
        teamName: 'Real Madrid',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.FW,
        birthDate: '1998-12-20',
        heightCm: 178,
        weightKg: 75,
        rawPayload: { seededAt: now },
      },
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-bellingham',
        fullName: 'Jude Bellingham',
        nationality: 'England',
        teamName: 'Real Madrid',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.MID,
        birthDate: '2003-06-29',
        heightCm: 186,
        weightKg: 75,
        rawPayload: { seededAt: now },
      },
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-rodri',
        fullName: 'Rodri',
        nationality: 'Spain',
        teamName: 'Manchester City',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.MID,
        birthDate: '1996-06-22',
        heightCm: 191,
        weightKg: 82,
        rawPayload: { seededAt: now },
      },
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-ruben-dias',
        fullName: 'Ruben Dias',
        nationality: 'Portugal',
        teamName: 'Manchester City',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.DEF,
        birthDate: '1997-05-14',
        heightCm: 186,
        weightKg: 83,
        rawPayload: { seededAt: now },
      },
      {
        provider: PlayerProviderEnum.MANUAL,
        providerPlayerId: 'manual-donnarumma',
        fullName: 'Gianluigi Donnarumma',
        nationality: 'Italy',
        teamName: 'PSG',
        competitionCode: 'MANUAL',
        position: PlayerPositionEnum.GK,
        birthDate: '1999-02-25',
        heightCm: 196,
        weightKg: 90,
        rawPayload: { seededAt: now },
      },
    ];

    const stats = [
      {
        providerPlayerId: 'manual-messi',
        appearances: 28,
        minutes: 2200,
        goals: 20,
        assists: 12,
        shots: 90,
        passes: 1200,
        tackles: 12,
        interceptions: 6,
        dribbles: 80,
        yellowCards: 2,
        redCards: 0,
      },
      {
        providerPlayerId: 'manual-mbappe',
        appearances: 30,
        minutes: 2500,
        goals: 25,
        assists: 8,
        shots: 110,
        passes: 900,
        tackles: 10,
        interceptions: 5,
        dribbles: 95,
        yellowCards: 3,
        redCards: 0,
      },
      {
        providerPlayerId: 'manual-bellingham',
        appearances: 32,
        minutes: 2700,
        goals: 14,
        assists: 10,
        shots: 70,
        passes: 1700,
        tackles: 55,
        interceptions: 30,
        dribbles: 52,
        yellowCards: 6,
        redCards: 0,
      },
      {
        providerPlayerId: 'manual-rodri',
        appearances: 33,
        minutes: 2850,
        goals: 7,
        assists: 9,
        shots: 40,
        passes: 2800,
        tackles: 75,
        interceptions: 42,
        dribbles: 30,
        yellowCards: 8,
        redCards: 1,
      },
      {
        providerPlayerId: 'manual-ruben-dias',
        appearances: 31,
        minutes: 2750,
        goals: 4,
        assists: 2,
        shots: 18,
        passes: 2400,
        tackles: 90,
        interceptions: 58,
        dribbles: 18,
        yellowCards: 7,
        redCards: 0,
      },
      {
        providerPlayerId: 'manual-donnarumma',
        appearances: 34,
        minutes: 3060,
        goals: 0,
        assists: 0,
        shots: 0,
        passes: 1150,
        tackles: 3,
        interceptions: 1,
        dribbles: 2,
        yellowCards: 1,
        redCards: 0,
      },
    ].map((row) => ({
      ...row,
      season,
      rating: null,
      rawPayload: { seededAt: now },
    }));

    return this.importManual({
      season,
      players: players as any,
      stats: stats as any,
    });
  }

  async list(filters?: {
    team?: string;
    position?: string;
    competitionCode?: string;
    q?: string;
    limit?: number;
    page?: number;
    url?: string;
  }) {
    const where: any = {};
    if (filters?.team) where.teamName = ILike(`%${filters.team}%`);
    if (filters?.position) where.position = filters.position as any;
    if (filters?.competitionCode)
      where.competitionCode = filters.competitionCode;
    if (filters?.q) where.fullName = ILike(`%${filters.q}%`);

    return paginate(
      this.playerRepo,
      {
        page: filters?.page ?? 1,
        limit: Math.min(filters?.limit || 100, 5000),
        route: filters?.url,
      },
      {
        where,
        order: { fullName: 'ASC' },
      },
    );
  }

  async stats(playerId: string, page = 1, limit = 20, url?: string) {
    return paginate(
      this.statRepo,
      {
        page,
        limit: Math.min(limit, 200),
        route: url,
      },
      {
        where: { player: { id: playerId } },
        order: { season: 'DESC' },
      },
    );
  }

  async syncHistory(page = 1, limit = 20, url?: string) {
    return paginate(
      this.runRepo,
      {
        page,
        limit: Math.min(limit, 200),
        route: url,
      },
      {
        order: { createdAt: 'DESC' },
      },
    );
  }

  async adminGetById(id: string) {
    const player = await this.playerRepo.findOne({ where: { id } });
    if (!player) throw new NotFoundException('Player not found.');
    return player;
  }

  async adminUpdatePlayer(id: string, payload: Record<string, unknown>) {
    const player = await this.adminGetById(id);
    const allowedKeys = new Set([
      'fullName',
      'nationality',
      'teamName',
      'competitionCode',
      'position',
      'birthDate',
      'heightCm',
      'weightKg',
      'rawPayload',
    ]);
    for (const [key, value] of Object.entries(payload || {})) {
      if (allowedKeys.has(key)) {
        (player as any)[key] = value;
      }
    }
    return this.playerRepo.save(player);
  }

  async adminDeletePlayer(id: string) {
    const player = await this.adminGetById(id);
    await this.playerRepo.softRemove(player);
    return { deleted: true, playerId: id };
  }

  private async upsertPlayers(
    providerName: Player['provider'],
    rows: ProviderPlayer[],
  ) {
    let imported = 0;
    for (const row of rows) {
      const existing = await this.playerRepo.findOne({
        where: {
          provider: providerName,
          providerPlayerId: row.providerPlayerId,
        },
      });
      if (!existing) {
        await this.playerRepo.save(
          this.playerRepo.create({
            ...row,
            provider: providerName,
          } as any),
        );
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
    providerName: Player['provider'],
    season: number,
    rows: ProviderPlayerStats[],
  ) {
    let imported = 0;
    for (const row of rows) {
      const player = await this.playerRepo.findOne({
        where: {
          provider: providerName,
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
