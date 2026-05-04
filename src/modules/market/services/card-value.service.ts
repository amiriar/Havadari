import { Card } from '@app/cards/entities/card.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketTrade } from '../entities/market-trade.entity';

@Injectable()
export class CardValueService {
  constructor(
    @InjectRepository(MarketTrade)
    private readonly tradeRepo: Repository<MarketTrade>,
  ) {}

  async calculate(card: Card) {
    const baseValue = Number(card.baseValue || 0);
    const performanceMultiplier =
      1 + Number(card.weeklyPerformanceScore || 0) / 100;
    const demandMultiplier = 1 + (await this.getDemandFactor(card.id)) * 0.5;
    return Math.max(
      1,
      Math.floor(baseValue * performanceMultiplier * demandMultiplier),
    );
  }

  private async getDemandFactor(cardId: string) {
    const daysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const thisCardRaw = await this.tradeRepo
      .createQueryBuilder('trade')
      .leftJoin('trade.userCard', 'userCard')
      .leftJoin('userCard.card', 'card')
      .where('card.id = :cardId', { cardId })
      .andWhere('trade.createdAt >= :daysAgo', { daysAgo })
      .select('COUNT(trade.id)', 'count')
      .getRawOne<{ count?: string }>();
    const cardVolume = Number(thisCardRaw?.count || 0);

    const maxRaw = await this.tradeRepo
      .createQueryBuilder('trade')
      .leftJoin('trade.userCard', 'userCard')
      .leftJoin('userCard.card', 'card')
      .where('trade.createdAt >= :daysAgo', { daysAgo })
      .select('card.id', 'cardId')
      .addSelect('COUNT(trade.id)', 'tradeCount')
      .groupBy('card.id')
      .orderBy('tradeCount', 'DESC')
      .limit(1)
      .getRawOne<{ tradeCount?: string }>();

    const maxVolume = Math.max(1, Number(maxRaw?.tradeCount || 0));
    return Math.min(1, cardVolume / maxVolume);
  }
}
