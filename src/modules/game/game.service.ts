import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BattleCategory,
  BattleResult,
  Card,
  MarketListing,
  PlayerProfile,
} from './game.types';

@Injectable()
export class GameService {
  private readonly profile: PlayerProfile = {
    username: 'player_iran',
    level: 1,
    exp: 0,
    trophies: 0,
    FGC: 5000,
    gems: 250,
  };

  private readonly cards: Card[] = [
    {
      id: 'card-messi-99',
      playerName: 'Lionel Messi',
      nationality: 'Argentina',
      position: 'FW',
      overallRating: 99,
      stats: { speed: 92, power: 87, skill: 99, attack: 98, defend: 45 },
      rarity: 'MYTHIC',
      edition: 'WORLD_CUP_2026',
      avatar: 'https://cdn.havadari/cards/messi.png',
      baseValue: 30000,
      isListed: false,
      ownerId: 'me',
    },
    {
      id: 'card-rodri-98',
      playerName: 'Rodri',
      nationality: 'Spain',
      position: 'MID',
      overallRating: 98,
      stats: { speed: 80, power: 90, skill: 95, attack: 88, defend: 94 },
      rarity: 'LEGENDARY',
      edition: 'WORLD_CUP_2026',
      avatar: 'https://cdn.havadari/cards/rodri.png',
      baseValue: 8000,
      isListed: false,
      ownerId: 'me',
    },
  ];

  private readonly squad: string[] = ['card-messi-99', 'card-rodri-98'];
  private readonly listings: MarketListing[] = [];
  private readonly battles: BattleResult[] = [];
  private readonly predictions: any[] = [];

  getProfile() {
    return this.profile;
  }

  updateProfile(payload: Partial<PlayerProfile>) {
    Object.assign(this.profile, payload);
    return this.profile;
  }

  getCards() {
    return this.cards;
  }

  getSquad() {
    return this.squad;
  }

  updateSquad(cardIds: string[]) {
    this.squad.length = 0;
    this.squad.push(...cardIds.slice(0, 5));
    return { squad: this.squad };
  }

  getStats() {
    const totalCardsValue = this.cards.reduce((sum, card) => sum + card.baseValue, 0);
    return {
      totalCards: this.cards.length,
      highestRating: Math.max(...this.cards.map((card) => card.overallRating)),
      cardsValue: totalCardsValue,
      trophies: this.profile.trophies,
      level: this.profile.level,
    };
  }

  findMatch() {
    return { matchId: randomUUID(), status: 'found', mode: 'classic' };
  }

  startBattle(type: string = 'classic') {
    return { battleId: randomUUID(), type, status: 'started' };
  }

  playRound(player1CardId: string, player2CardId: string, category: BattleCategory) {
    const p1 = this.cards.find((card) => card.id === player1CardId);
    if (!p1) {
      throw new NotFoundException('player1 card not found');
    }
    const p1Stat = p1.stats[category];
    const p2Stat = Math.max(60, p1Stat - 3);
    return {
      category,
      player1Stat: p1Stat,
      player2Stat: p2Stat,
      winner: p1Stat >= p2Stat ? 'player1' : 'player2',
    };
  }

  endBattle(type: string = 'classic') {
    const result: BattleResult = {
      id: randomUUID(),
      type: type as any,
      player1Id: 'me',
      player2Id: 'bot',
      rounds: [],
      winnerId: 'me',
      createdAt: new Date(),
    };
    this.profile.FGC += 100;
    this.profile.exp += 50;
    this.profile.trophies += 30;
    this.battles.unshift(result);
    return result;
  }

  getBattleHistory() {
    return this.battles;
  }

  getMarketListings() {
    return this.listings;
  }

  listCard(cardId: string, price: number) {
    const card = this.cards.find((item) => item.id === cardId);
    if (!card) {
      throw new NotFoundException('card not found');
    }
    const listing: MarketListing = {
      id: randomUUID(),
      cardId,
      sellerId: 'me',
      price,
      status: 'active',
    };
    card.isListed = true;
    this.listings.unshift(listing);
    return listing;
  }

  buyCard(listingId: string) {
    const listing = this.listings.find((item) => item.id === listingId && item.status === 'active');
    if (!listing) {
      throw new NotFoundException('listing not found');
    }
    listing.status = 'sold';
    this.profile.FGC -= listing.price;
    return { listingId, status: 'sold' };
  }

  bid(listingId: string, amount: number) {
    const listing = this.listings.find((item) => item.id === listingId && item.status === 'active');
    if (!listing) {
      throw new NotFoundException('listing not found');
    }
    return { listingId, amount, accepted: true };
  }

  removeListing(listingId: string) {
    const listing = this.listings.find((item) => item.id === listingId);
    if (!listing) {
      throw new NotFoundException('listing not found');
    }
    listing.status = 'cancelled';
    return { listingId, status: 'cancelled' };
  }

  getChests() {
    return [
      { type: 'common_chest', FGC: 300 },
      { type: 'rare_chest', FGC: 900, gem: 40 },
      { type: 'epic_chest', gem: 100 },
      { type: 'legendary_chest', gem: 250 },
      { type: 'world_cup_chest', gem: 180 },
      { type: 'sponsor_chest', free: true },
    ];
  }

  openChest(chestType: string) {
    return {
      chestType,
      rewards: [{ type: 'card', rarity: 'RARE', cardId: 'card-rodri-98' }],
    };
  }

  purchaseGems(gems: number) {
    this.profile.gems += gems;
    return { gems: this.profile.gems };
  }

  getPurchaseHistory() {
    return [];
  }

  getPredictionMatches() {
    return [{ id: 'wc-2026-arg-fra', home: 'Argentina', away: 'France' }];
  }

  placePrediction(input: { matchId: string; type: string; value: string; betAmount: number }) {
    const item = {
      id: randomUUID(),
      ...input,
      odds: 1.8,
      result: 'pending',
      createdAt: new Date(),
    };
    this.predictions.unshift(item);
    return item;
  }

  myPredictions() {
    return this.predictions;
  }

  getLeaderboard(type: string, region = 'IR') {
    return {
      type,
      region,
      top: [
        { rank: 1, username: 'havadari_pro', score: 12000 },
        { rank: 2, username: 'iran_goal', score: 10500 },
      ],
    };
  }
}
