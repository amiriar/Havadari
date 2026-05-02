import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { Card } from '../entities/card.entity';
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

  async generateFromPlayers(season = 2026) {
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
          position: player.position || 'MID',
          overallRating: ratings.overall,
          speed: ratings.speed,
          power: ratings.power,
          skill: ratings.skill,
          attack: ratings.attack,
          defend: ratings.defend,
          rarity,
          edition: 'BASE',
          baseValue,
          avatarStatus: 'PENDING',
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
        await this.cardRepo.save(existing);
        updated += 1;
      }
    }

    return { totalPlayers: players.length, inserted, updated };
  }

  async listCards(limit = 500) {
    return this.cardRepo.find({
      order: { overallRating: 'DESC' },
      take: Math.min(5000, limit),
    });
  }
}
