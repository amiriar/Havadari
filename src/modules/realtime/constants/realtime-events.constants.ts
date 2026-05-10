export const REALTIME_NAMESPACE = '/realtime';

export const RealtimeClientEvents = {
  SUBSCRIBE_BATTLE: 'subscribe.battle',
  UNSUBSCRIBE_BATTLE: 'unsubscribe.battle',
  SUBSCRIBE_CLAN: 'subscribe.clan',
  UNSUBSCRIBE_CLAN: 'unsubscribe.clan',
  SEND_CLAN_MESSAGE: 'send.clan.message',
} as const;

export const RealtimeServerEvents = {
  CONNECTED: 'connected',
  BATTLE_CREATED: 'battle.created',
  BATTLE_ROUND_PLAYED: 'battle.round.played',
  BATTLE_ENDED: 'battle.ended',
  TOURNAMENT_PARTICIPANT_JOINED: 'tournament.participant.joined',
  TOURNAMENT_MATCH_STARTED: 'tournament.match.started',
  TOURNAMENT_MATCH_RESOLVED: 'tournament.match.resolved',
  CLAN_MESSAGE_CREATED: 'clan.message.created',
  ERROR: 'error',
} as const;

export function userRoom(userId: string) {
  return `user:${userId}`;
}

export function battleRoom(battleId: string) {
  return `battle:${battleId}`;
}

export function tournamentRoom(tournamentId: string) {
  return `tournament:${tournamentId}`;
}

export function clanRoom(clanId: string) {
  return `clan:${clanId}`;
}

