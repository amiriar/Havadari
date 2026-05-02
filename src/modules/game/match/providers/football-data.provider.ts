import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchProvider, ProviderMatch } from './match-provider.interface';

@Injectable()
export class FootballDataProvider implements MatchProvider {
  readonly name = 'football-data' as const;

  constructor(private readonly config: ConfigService) {}

  async fetchWorldCupMatches(season: number): Promise<ProviderMatch[]> {
    const apiKey = this.config.get<string>('FOOTBALL_DATA_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('FOOTBALL_DATA_API_KEY is missing');
    }

    const baseUrl = this.config.get<string>(
      'FOOTBALL_DATA_BASE_URL',
      'https://api.football-data.org/v4',
    );

    const url = `${baseUrl}/competitions/WC/matches?season=${season}`;
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(
        `football-data request failed: ${response.status} ${text}`,
      );
    }

    const payload = (await response.json()) as {
      matches?: Array<Record<string, any>>;
    };
    const matches = payload.matches || [];

    return matches.map((item) => ({
      provider: this.name,
      providerMatchId: String(item.id),
      homeTeam: item.homeTeam?.name || 'TBD',
      awayTeam: item.awayTeam?.name || 'TBD',
      matchDateUtc: new Date(item.utcDate),
      venue: item.venue || null,
      stage: item.stage || null,
      status: item.status || 'SCHEDULED',
      groupName: item.group || null,
      winner: item.score?.winner || null,
      rawPayload: item,
    }));
  }
}
