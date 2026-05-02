export interface ProviderPlayer {
  provider: 'football-data' | 'api-football';
  providerPlayerId: string;
  fullName: string;
  nationality: string | null;
  teamName: string | null;
  competitionCode: string | null;
  position: 'GK' | 'DEF' | 'MID' | 'FW' | null;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  rawPayload: Record<string, unknown>;
}

export interface ProviderPlayerStats {
  providerPlayerId: string;
  season: number;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  passes: number;
  tackles: number;
  interceptions: number;
  dribbles: number;
  yellowCards: number;
  redCards: number;
  rating: number | null;
  rawPayload: Record<string, unknown>;
}

export interface PlayerProvider {
  readonly name: 'football-data' | 'api-football';
  fetchPlayers(season: number, competitions?: string[]): Promise<ProviderPlayer[]>;
  fetchPlayerStats(
    season: number,
    competitions?: string[],
  ): Promise<ProviderPlayerStats[]>;
}

