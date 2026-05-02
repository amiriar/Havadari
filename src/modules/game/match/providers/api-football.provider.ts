import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchProvider, ProviderMatch } from './match-provider.interface';

@Injectable()
export class ApiFootballProvider implements MatchProvider {
  readonly name = 'api-football' as const;

  constructor(private readonly config: ConfigService) {}

  async fetchWorldCupMatches(season: number): Promise<ProviderMatch[]> {
    const apiKey = this.config.get<string>('API_FOOTBALL_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('API_FOOTBALL_API_KEY is missing');
    }

    const baseUrl = this.config.get<string>(
      'API_FOOTBALL_BASE_URL',
      'https://v3.football.api-sports.io',
    );
    const leagueId = this.config.get<string>('API_FOOTBALL_WORLD_CUP_LEAGUE_ID', '1');

    const url = `${baseUrl}/fixtures?league=${leagueId}&season=${season}`;
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(
        `api-football request failed: ${response.status} ${text}`,
      );
    }

    const payload = (await response.json()) as {
      response?: Array<Record<string, any>>;
    };
    const matches = payload.response || [];

    return matches.map((item) => ({
      provider: this.name,
      providerMatchId: String(item.fixture?.id),
      homeTeam: item.teams?.home?.name || 'TBD',
      awayTeam: item.teams?.away?.name || 'TBD',
      matchDateUtc: new Date(item.fixture?.date),
      venue: item.fixture?.venue?.name || null,
      stage: item.league?.round || null,
      status: item.fixture?.status?.short || 'NS',
      groupName: item.league?.round || null,
      winner: item.teams?.home?.winner
        ? 'HOME_TEAM'
        : item.teams?.away?.winner
          ? 'AWAY_TEAM'
          : null,
      rawPayload: item,
    }));
  }
}
