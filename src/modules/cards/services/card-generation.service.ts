import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Player } from '@app/players/entities/player.entity';
import { PlayerStatSnapshot } from '@app/players/entities/player-stat-snapshot.entity';
import { BASE_UPLOAD_PATH } from '@common/utils/constants.utils';
import { Card } from '../entities/card.entity';
import {
  AvatarStatusEnum,
  CardEditionEnum,
  PlayerPositionEnum,
} from '../constants/card.enums';
import { PlayerRatingService } from './player-rating.service';
import { AdminCardQueryDto } from '../dto/admin-card-query.dto';
import { AdminCreateCardDto } from '../dto/admin-create-card.dto';
import { AdminUpdateCardDto } from '../dto/admin-update-card.dto';
import { AdminReviewCardsQueryDto } from '../dto/admin-review-cards-query.dto';
import { AdminFlagCardImageDto } from '../dto/admin-flag-card-image.dto';

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
      const hasStats = this.ratingService.hasMeaningfulStats(stats);
      const ratings = this.ratingService.calculate(player, stats);
      if (!hasStats) {
        ratings.overall = this.ratingService.deterministicFallbackOverall(player);
      }
      const marketValue = this.readPlayerMarketValue(player);
      const rarity = this.ratingService.rarityFromMarketValue(
        marketValue,
        this.isRetiredLegend(player, ratings.overall),
      );
      const tunedRatings = this.ratingService.tuneRatingsByMarketValue(
        ratings,
        marketValue,
        rarity,
      );
      const baseValue = this.ratingService.adjustedBaseValue(
        rarity,
        tunedRatings.overall,
      );
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
          teamName: player.teamName || null,
          marketValue,
          position: player.position || PlayerPositionEnum.MID,
          overallRating: tunedRatings.overall,
          speed: tunedRatings.speed,
          power: tunedRatings.power,
          skill: tunedRatings.skill,
          attack: tunedRatings.attack,
          defend: tunedRatings.defend,
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
        const nextTeamName = player.teamName || null;
        const nextMarketValue = marketValue;
        existing.playerName = player.fullName || 'Unknown';
        existing.nationality = player.nationality || existing.nationality;
        if (nextTeamName !== null) {
          existing.teamName = nextTeamName;
        }
        if (nextMarketValue !== null) {
          existing.marketValue = nextMarketValue;
        }
        existing.position = player.position || existing.position;
        existing.overallRating = tunedRatings.overall;
        existing.speed = tunedRatings.speed;
        existing.power = tunedRatings.power;
        existing.skill = tunedRatings.skill;
        existing.attack = tunedRatings.attack;
        existing.defend = tunedRatings.defend;
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
    const qb = this.cardRepo
      .createQueryBuilder('card')
      .select([
        'card.id',
        'card.playerName',
        'card.nationality',
        'card.teamName',
        'card.position',
        'card.overallRating',
        'card.speed',
        'card.power',
        'card.skill',
        'card.attack',
        'card.defend',
        'card.rarity',
        'card.avatarUrl',
        'card.baseValue',
      ])
      .orderBy('card.overallRating', 'DESC');

    return paginate(qb, {
      page,
      limit: Math.min(5000, limit),
      route: url,
    });
  }

  async getCardDetails(cardId: string) {
    const card = await this.cardRepo.findOne({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found.');
    }

    return card;
  }

  async exportChecklistExcels(chunkSize = 100) {
    const normalizedChunkSize = Math.max(1, Math.min(100, chunkSize));
    const total = await this.cardRepo.count();
    const uploadsDir = path.join(BASE_UPLOAD_PATH, 'excels', 'cards-checklist');
    fs.mkdirSync(uploadsDir, { recursive: true });

    const createdFiles: Array<{
      filePath: string;
      fileName: string;
      from: number;
      to: number;
      count: number;
    }> = [];

    if (!total) {
      return {
        totalCards: 0,
        chunkSize: normalizedChunkSize,
        totalFiles: 0,
        files: createdFiles,
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (let offset = 0; offset < total; offset += normalizedChunkSize) {
      const cards = await this.cardRepo.find({
        select: {
          id: true,
          playerName: true,
          nationality: true,
          teamName: true,
          position: true,
          rarity: true,
        },
        order: { createdAt: 'ASC' },
        skip: offset,
        take: normalizedChunkSize,
      });

      const rows = cards.map((card) => ({
        id: card.id,
        playername: card.playerName,
        nationallity: card.nationality,
        position: card.position,
        rarity: card.rarity,
        prompt: this.buildAvatarPrompt(
          card.playerName,
          card.nationality,
          card.teamName ?? 'Unknown Team',
          String(card.position),
        ),
        checklist: '',
      }));

      const ws = XLSX.utils.json_to_sheet(rows, {
        header: [
          'id',
          'playername',
          'nationallity',
          'position',
          'rarity',
          'prompt',
          'checklist',
        ],
      });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'cards');

      const start = offset + 1;
      const end = offset + cards.length;
      const fileIndex = Math.floor(offset / normalizedChunkSize) + 1;
      const fileName = `cards-checklist-${timestamp}-part-${String(fileIndex).padStart(2, '0')}.xlsx`;
      const filePath = path.join(uploadsDir, fileName);
      XLSX.writeFile(wb, filePath);

      createdFiles.push({
        filePath,
        fileName,
        from: start,
        to: end,
        count: cards.length,
      });
    }

    return {
      totalCards: total,
      chunkSize: normalizedChunkSize,
      totalFiles: createdFiles.length,
      files: createdFiles,
    };
  }

  async adminList(query: AdminCardQueryDto, url?: string) {
    const qb = this.cardRepo.createQueryBuilder('card');
    if (query.q?.trim()) {
      qb.andWhere('card.playerName ILIKE :q', { q: `%${query.q.trim()}%` });
    }
    if (query.rarity) qb.andWhere('card.rarity = :rarity', { rarity: query.rarity });
    if (query.position) qb.andWhere('card.position = :position', { position: query.position });
    if (query.edition) qb.andWhere('card.edition = :edition', { edition: query.edition });
    qb.orderBy('card.createdAt', 'DESC');

    return paginate(qb, {
      page: query.page ?? 1,
      limit: Math.min(500, query.limit ?? 20),
      route: url,
    });
  }

  async adminGetById(id: string) {
    const card = await this.cardRepo.findOne({ where: { id } });
    if (!card) throw new NotFoundException('Card not found.');
    return card;
  }

  async adminCreate(dto: AdminCreateCardDto) {
    const entity = this.cardRepo.create({
      sourceProvider: dto.sourceProvider ?? null,
      sourceProviderPlayerId: dto.sourceProviderPlayerId ?? null,
      playerName: dto.playerName,
      nationality: dto.nationality,
      teamName: dto.teamName ?? null,
      marketValue: dto.marketValue ?? null,
      position: dto.position,
      overallRating: dto.overallRating,
      speed: dto.speed,
      power: dto.power,
      skill: dto.skill,
      attack: dto.attack,
      defend: dto.defend,
      rarity: dto.rarity,
      edition: dto.edition,
      baseValue: dto.baseValue,
      weeklyPerformanceScore: dto.weeklyPerformanceScore ?? 0,
      ratingVersion: dto.ratingVersion ?? 'v1',
      avatarStatus: AvatarStatusEnum.PENDING,
    });
    return this.cardRepo.save(entity);
  }

  async adminUpdate(id: string, dto: AdminUpdateCardDto) {
    const card = await this.adminGetById(id);
    Object.assign(card, dto);
    return this.cardRepo.save(card);
  }

  async adminDelete(id: string) {
    const card = await this.adminGetById(id);
    await this.cardRepo.softRemove(card);
    return { deleted: true, cardId: id };
  }

  async adminListHighValueForReview(query: AdminReviewCardsQueryDto, url?: string) {
    const minMarketValue = Math.max(1, query.minMarketValue ?? 50_000_000);
    const qb = this.cardRepo
      .createQueryBuilder('card')
      .select([
        'card.id',
        'card.playerName',
        'card.teamName',
        'card.nationality',
        'card.position',
        'card.marketValue',
        'card.baseValue',
        'card.overallRating',
        'card.avatarUrl',
        'card.avatarStatus',
        'card.imageMismatchFlag',
        'card.imageMismatchNote',
        'card.imageReviewedAt',
        'card.imageReviewedByUserId',
      ])
      .where('COALESCE(card.marketValue, 0) >= :minMarketValue', {
        minMarketValue,
      })
      .orderBy('card.marketValue', 'DESC')
      .addOrderBy('card.overallRating', 'DESC');

    if (query.flaggedOnly) {
      qb.andWhere('card.imageMismatchFlag = true');
    }

    return paginate(qb, {
      page: query.page ?? 1,
      limit: Math.min(200, query.limit ?? 50),
      route: url,
    });
  }

  async adminSetImageMismatchFlag(
    id: string,
    dto: AdminFlagCardImageDto,
    reviewerUserId: string,
  ) {
    const card = await this.adminGetById(id);
    card.imageMismatchFlag = dto.flagged;
    card.imageMismatchNote = dto.note?.trim() || null;
    card.imageReviewedAt = new Date();
    card.imageReviewedByUserId = reviewerUserId;
    await this.cardRepo.save(card);

    return {
      cardId: card.id,
      flagged: card.imageMismatchFlag,
      note: card.imageMismatchNote,
      reviewedAt: card.imageReviewedAt,
      reviewedByUserId: card.imageReviewedByUserId,
    };
  }

  private readPlayerMarketValue(player: Player): number | null {
    const raw = (player.rawPayload || {}) as Record<string, unknown>;
    const direct = raw.marketValue;
    if (typeof direct === 'number' && Number.isFinite(direct)) return Math.round(direct);
    if (typeof direct === 'string' && direct.trim() && Number.isFinite(Number(direct))) {
      return Math.round(Number(direct));
    }
    const nestedPlayer = raw.player as Record<string, unknown> | undefined;
    const nested = nestedPlayer?.marketValue;
    if (typeof nested === 'number' && Number.isFinite(nested)) return Math.round(nested);
    if (typeof nested === 'string' && nested.trim() && Number.isFinite(Number(nested))) {
      return Math.round(Number(nested));
    }
    return null;
  }

  private isRetiredLegend(player: Player, overall: number): boolean {
    const payload = (player.rawPayload || {}) as Record<string, unknown>;
    const status = String(payload.status || payload.playerStatus || '').toLowerCase();
    const explicitlyRetired =
      payload.retired === true ||
      payload.active === false ||
      status.includes('retired');
    return explicitlyRetired && overall >= 90;
  }

  private buildAvatarPrompt(
    playerName: string,
    nationality: string,
    teamName: string,
    position: string,
  ): string {
    return (
      `Cartoon flat-vector chest-up bust portrait of ${playerName}, ${nationality} professional football player, ${position}, wearing a football jersey inspired by ${teamName} Team colors. ` +
      `Show the player as a clean cutout only, with no background elements.\n\n` +
      `Make the illustration more cartoony and stylized, with slightly exaggerated facial features, simplified shapes, a playful sports-avatar look, bold expression, and a more illustrated character feel rather than a semi-realistic one.\n\n` +
      `Use a transparent background if possible. If transparency is not supported, use a plain white background as the fallback. No other background color or background design.\n\n` +
      `No card, no frame, no border, no stats, no text, no badge, no logo, no sponsor, no circular shape, no oval shape, no glow blob, no colored silhouette behind the player, ` +
      `no aura behind the head or shoulders, no backdrop, and no halo background.\n\n` +
      `The player should be cropped from the chest and above, centered, front-facing, symmetrical pose. Use a polished cartoon sports avatar illustration style with smooth gradients, ` +
      `thick clean outlines, simplified anatomy, sticker/avatar aesthetic, rounded shapes, vibrant but clean coloring, and high detail.\n\n` +
      `2D vector art, not realistic. Final image must be square 1:1 aspect ratio, with the character centered. Background should be transparent if available, with solid white as fallback.`
    );
  }
}
