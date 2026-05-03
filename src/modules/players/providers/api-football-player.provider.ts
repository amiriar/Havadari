import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlayerPositionEnum,
  PlayerProviderEnum,
} from '../constants/player.enums';
import {
  PlayerProvider,
  ProviderPlayer,
  ProviderPlayerStats,
} from './player-provider.interface';

@Injectable()
export class ApiFootballPlayerProvider implements PlayerProvider {
  readonly name = PlayerProviderEnum.API_FOOTBALL;

  constructor(private readonly config: ConfigService) {}

  async fetchPlayers(
    season: number,
    competitions?: string[],
  ): Promise<ProviderPlayer[]> {
    const rows = await this.fetchRows(season, competitions);
    return rows.map((row) => {
      const player = row.player || {};
      const stat = row.statistics?.[0] || {};
      return {
        provider: this.name,
        providerPlayerId: String(player.id),
        fullName: player.name || 'Unknown',
        nationality: player.nationality || null,
        teamName: stat.team?.name || null,
        competitionCode: String(stat.league?.id || ''),
        position: this.mapPosition(stat.games?.position),
        birthDate: player.birth?.date || null,
        heightCm: this.parseMetric(player.height),
        weightKg: this.parseMetric(player.weight),
        rawPayload: row,
      };
    });
  }

  async fetchPlayerStats(
    season: number,
    competitions?: string[],
  ): Promise<ProviderPlayerStats[]> {
    const rows = await this.fetchRows(season, competitions);
    return rows.map((row) => {
      const player = row.player || {};
      const stat = row.statistics?.[0] || {};
      return {
        providerPlayerId: String(player.id),
        season,
        appearances: Number(stat.games?.appearences || 0),
        minutes: Number(stat.games?.minutes || 0),
        goals: Number(stat.goals?.total || 0),
        assists: Number(stat.goals?.assists || 0),
        shots: Number(stat.shots?.total || 0),
        passes: Number(stat.passes?.total || 0),
        tackles: Number(stat.tackles?.total || 0),
        interceptions: Number(stat.tackles?.interceptions || 0),
        dribbles: Number(stat.dribbles?.success || 0),
        yellowCards: Number(stat.cards?.yellow || 0),
        redCards: Number(stat.cards?.red || 0),
        rating: stat.games?.rating ? Number(stat.games.rating) : null,
        rawPayload: row,
      };
    });
  }

  private async fetchRows(
    season: number,
    competitions?: string[],
  ): Promise<any[]> {
    const apiKey = this.config.get<string>('API_FOOTBALL_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('API_FOOTBALL_API_KEY is missing');
    }
    const baseUrl = this.config.get<string>(
      'API_FOOTBALL_BASE_URL',
      'https://v3.football.api-sports.io',
    );
    const leagues = competitions?.length
      ? competitions
      : this.config
          .get<string>('API_FOOTBALL_LEAGUE_IDS', '1,39,140,135,78,61,2,3')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

    const out: any[] = [];
    for (const leagueId of leagues) {
      let page = 1;
      while (true) {
        const response = await fetch(
          `${baseUrl}/players?league=${leagueId}&season=${season}&page=${page}`,
          {
            headers: { 'x-apisports-key': apiKey },
          },
        );
        if (!response.ok) {
          throw new InternalServerErrorException(
            `api-football request failed: ${response.status} league=${leagueId} page=${page}`,
          );
        }
        const payload = (await response.json()) as {
          response?: any[];
          paging?: { current?: number; total?: number };
        };
        const rows = payload.response || [];
        out.push(...rows);
        const current = payload.paging?.current || page;
        const total = payload.paging?.total || page;
        if (rows.length === 0 || current >= total || page >= 50) {
          break;
        }
        page += 1;
      }
    }
    return out;
  }

  private mapPosition(raw: string | undefined): PlayerPositionEnum | null {
    if (!raw) return null;
    const value = raw.toUpperCase();
    if (value.includes('GOAL')) return PlayerPositionEnum.GK;
    if (value.includes('DEF')) return PlayerPositionEnum.DEF;
    if (value.includes('MID')) return PlayerPositionEnum.MID;
    if (value.includes('ATT') || value.includes('FOR'))
      return PlayerPositionEnum.FW;
    return null;
  }

  private parseMetric(raw: string | undefined): number | null {
    if (!raw) return null;
    const match = raw.match(/(\d+)/);
    return match ? Number(match[1]) : null;
  }
}
