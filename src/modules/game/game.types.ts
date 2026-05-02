export type CardPosition = 'GK' | 'DEF' | 'MID' | 'FW';
export type CardRarity =
  | 'COMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC';
export type CardEdition =
  | 'WORLD_CUP_2026'
  | 'CLASSIC'
  | 'SPECIAL'
  | 'SPONSOR';
export type BattleType = 'classic' | 'ranked' | 'tournament' | 'duos';
export type BattleCategory = 'speed' | 'power' | 'skill' | 'attack' | 'defend';

export interface CardStats {
  speed: number;
  power: number;
  skill: number;
  attack: number;
  defend: number;
}

export interface Card {
  id: string;
  playerName: string;
  nationality: string;
  position: CardPosition;
  overallRating: number;
  stats: CardStats;
  rarity: CardRarity;
  edition: CardEdition;
  avatar: string;
  baseValue: number;
  isListed: boolean;
  ownerId: string;
}

export interface PlayerProfile {
  username: string;
  level: number;
  exp: number;
  trophies: number;
  FGC: number;
  gems: number;
}

export interface MarketListing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}

export interface BattleRound {
  roundNumber: number;
  category: BattleCategory;
  player1CardId: string;
  player2CardId: string;
  player1Stat: number;
  player2Stat: number;
  winnerId: string | 'draw';
}

export interface BattleResult {
  id: string;
  type: BattleType;
  player1Id: string;
  player2Id: string;
  rounds: BattleRound[];
  winnerId: string | 'draw';
  createdAt: Date;
}
