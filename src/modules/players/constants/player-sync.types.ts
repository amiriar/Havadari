export type ProviderDiagnostic = {
  provider: string;
  playersFetched: number;
  statsFetched: number;
  importedPlayers: number;
  importedStats: number;
  status: 'ok' | 'failed';
  error?: string;
};
