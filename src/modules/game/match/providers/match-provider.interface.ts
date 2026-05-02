export interface ProviderMatch {
  provider: 'football-data' | 'api-football';
  providerMatchId: string;
  homeTeam: string;
  awayTeam: string;
  matchDateUtc: Date;
  venue: string | null;
  stage: string | null;
  status: string;
  groupName: string | null;
  winner: string | null;
  rawPayload: Record<string, unknown>;
}

export interface MatchProvider {
  readonly name: 'football-data' | 'api-football';
  fetchWorldCupMatches(season: number): Promise<ProviderMatch[]>;
}
