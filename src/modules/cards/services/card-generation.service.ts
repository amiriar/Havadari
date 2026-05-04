import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { Card } from '../entities/card.entity';
import {
  AvatarStatusEnum,
  CardEditionEnum,
  PlayerPositionEnum,
} from '../constants/card.enums';
import { PlayerRatingService } from './player-rating.service';

@Injectable()
export class CardGenerationService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(PlayerStatSnapshot)
    private readonly statRepo: Repository<PlayerStatSnapshot>,
    private readonly ratingService: PlayerRatingService,
  ) {}

  async generateFromPlayers(season = 2026, ratingVersion = 'v1') {
    const players = await this.playerRepo.find();
    let inserted = 0;
    let updated = 0;

    for (const player of players) {
      const stats = await this.statRepo.findOne({
        where: { player: { id: player.id }, season },
      });
      const ratings = this.ratingService.calculate(player, stats);
      const rarity = this.ratingService.rarity(ratings.overall);
      const baseValue = this.ratingService.baseValue(rarity);
      const weeklyPerformanceScore =
        this.ratingService.weeklyPerformanceScore(stats);

      const existing = await this.cardRepo.findOne({
        where: {
          sourceProvider: player.provider,
          sourceProviderPlayerId: player.providerPlayerId,
        },
      });

      if (!existing) {
        const entity = this.cardRepo.create({
          sourceProvider: player.provider,
          sourceProviderPlayerId: player.providerPlayerId,
          playerName: player.fullName || 'Unknown',
          nationality: player.nationality || 'Unknown',
          position: player.position || PlayerPositionEnum.MID,
          overallRating: ratings.overall,
          speed: ratings.speed,
          power: ratings.power,
          skill: ratings.skill,
          attack: ratings.attack,
          defend: ratings.defend,
          rarity,
          edition: CardEditionEnum.BASE,
          baseValue,
          weeklyPerformanceScore,
          ratingVersion,
          avatarStatus: AvatarStatusEnum.PENDING,
          avatarUrl: null,
          avatarPrompt: null,
          avatarError: null,
        });
        await this.cardRepo.save(entity);
        inserted += 1;
      } else {
        existing.playerName = player.fullName || 'Unknown';
        existing.nationality = player.nationality || existing.nationality;
        existing.position = player.position || existing.position;
        existing.overallRating = ratings.overall;
        existing.speed = ratings.speed;
        existing.power = ratings.power;
        existing.skill = ratings.skill;
        existing.attack = ratings.attack;
        existing.defend = ratings.defend;
        existing.rarity = rarity;
        existing.baseValue = baseValue;
        existing.weeklyPerformanceScore = weeklyPerformanceScore;
        existing.ratingVersion = ratingVersion;
        await this.cardRepo.save(existing);
        updated += 1;
      }
    }

    return { totalPlayers: players.length, inserted, updated, ratingVersion };
  }

  async listCards(page = 1, limit = 100, url?: string) {
    return paginate(
      this.cardRepo,
      {
        page,
        limit: Math.min(5000, limit),
        route: url,
      },
      {
        order: { overallRating: 'DESC' },
      },
    );
  }
}
