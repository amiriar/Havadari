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
export class FootballDataPlayerProvider implements PlayerProvider {
  readonly name = PlayerProviderEnum.FOOTBALL_DATA;

  constructor(private readonly config: ConfigService) {}

  async fetchPlayers(
    season: number,
    competitions?: string[],
  ): Promise<ProviderPlayer[]> {
    const apiKey = this.config.get<string>('FOOTBALL_DATA_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'FOOTBALL_DATA_API_KEY is missing',
      );
    }
    const baseUrl = this.config.get<string>(
      'FOOTBALL_DATA_BASE_URL',
      'https://api.football-data.org/v4',
    );
    const compCodes = competitions?.length
      ? competitions
      : this.config
          .get<string>('FOOTBALL_DATA_COMPETITION_CODES', 'WC')
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean);

    const players: ProviderPlayer[] = [];
    for (const code of compCodes) {
      const response = await fetch(
        `${baseUrl}/competitions/${code}/teams?season=${season}`,
        { headers: { 'X-Auth-Token': apiKey } },
      );
      if (!response.ok) {
        throw new InternalServerErrorException(
          `football-data teams request failed: ${response.status} competition=${code}`,
        );
      }
      const payload = (await response.json()) as { teams?: any[] };
      const teams = payload.teams || [];
      for (const team of teams) {
        const squad = team.squad || [];
        for (const person of squad) {
          players.push({
            provider: this.name,
            providerPlayerId: String(person.id),
            fullName: person.name || 'Unknown',
            nationality: person.nationality || null,
            teamName: team.name || null,
            competitionCode: code,
            position: this.mapPosition(person.position),
            birthDate: person.dateOfBirth || null,
            heightCm: null,
            weightKg: null,
            rawPayload: person,
          });
        }
      }
    }
    return players;
  }

  async fetchPlayerStats(
    _season: number,
    _competitions?: string[],
  ): Promise<ProviderPlayerStats[]> {
    return [];
  }

  private mapPosition(raw: string | undefined): PlayerPositionEnum | null {
    if (!raw) return null;
    const value = raw.toLowerCase();
    if (value.includes('keeper')) return PlayerPositionEnum.GK;
    if (value.includes('defen')) return PlayerPositionEnum.DEF;
    if (value.includes('mid')) return PlayerPositionEnum.MID;
    if (value.includes('forw') || value.includes('attac'))
      return PlayerPositionEnum.FW;
    return null;
  }
}
