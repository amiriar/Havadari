import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  AvatarGenerationRunStatusEnum,
  AvatarStatusEnum,
  CardRarityEnum,
} from '../constants/card.enums';
import { AvatarGenerationRun } from '../entities/avatar-generation-run.entity';
import { Card } from '../entities/card.entity';
import { GapgptImageService } from './gapgpt-image.service';

@Injectable()
export class CardAvatarService {
  private readonly logger = new Logger(CardAvatarService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(AvatarGenerationRun)
    private readonly runRepo: Repository<AvatarGenerationRun>,
    private readonly gapgptImageService: GapgptImageService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async pollQueue() {
    await this.processQueue(20);
  }

  async queue(limit = 100) {
    const cards = await this.cardRepo.find({
      where: [{ avatarUrl: IsNull() }, { avatarUrl: '' }],
      order: { overallRating: 'DESC' },
      take: Math.min(limit, 1000),
    });
    for (const card of cards) {
      card.avatarStatus = AvatarStatusEnum.PENDING;
      if (!card.avatarPrompt) card.avatarPrompt = this.buildPrompt(card);
      await this.cardRepo.save(card);
    }
    return { queued: cards.length };
  }

  async regenerate(cardId: string) {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('card not found');
    card.avatarStatus = AvatarStatusEnum.PENDING;
    card.avatarError = null;
    card.avatarPrompt = this.buildPrompt(card);
    await this.cardRepo.save(card);
    return { queued: 1, cardId };
  }

  async processQueue(limit = 25) {
    const pending = await this.cardRepo.find({
      where: { avatarStatus: AvatarStatusEnum.PENDING },
      order: { updatedAt: 'ASC' },
      take: Math.min(200, limit),
    });
    if (!pending.length) return { requested: 0, generated: 0, failed: 0 };

    const run = this.runRepo.create({
      requestedCount: pending.length,
      generatedCount: 0,
      failedCount: 0,
      status: AvatarGenerationRunStatusEnum.SUCCESS,
      message: null,
    });
    await this.runRepo.save(run);

    for (const card of pending) {
      try {
        const prompt = card.avatarPrompt || this.buildPrompt(card);
        const generatedUrl = await this.generateAvatar(card, prompt);
        card.avatarPrompt = prompt;
        card.avatarUrl = generatedUrl;
        card.avatarStatus = AvatarStatusEnum.GENERATED;
        card.avatarError = null;
        await this.cardRepo.save(card);
        run.generatedCount += 1;
      } catch (error) {
        card.avatarStatus = AvatarStatusEnum.FAILED;
        card.avatarError =
          error instanceof Error ? error.message : String(error);
        await this.cardRepo.save(card);
        run.failedCount += 1;
      }
    }

    if (run.failedCount > 0) {
      run.status = AvatarGenerationRunStatusEnum.FAILED;
      run.message = `${run.failedCount} avatar generations failed`;
      this.logger.warn(run.message);
    }

    await this.runRepo.save(run);
    return {
      requested: run.requestedCount,
      generated: run.generatedCount,
      failed: run.failedCount,
    };
  }

  private async generateAvatar(card: Card, prompt: string): Promise<string> {
    const provider = (
      process.env.CARD_IMAGE_PROVIDER || 'placeholder'
    ).toLowerCase();
    if (provider === 'gapgpt') {
      return this.gapgptImageService.generateImage(prompt);
    }
    return this.buildPlaceholderAvatarUrl(card);
  }

  private buildPrompt(card: Card) {
    const rarityEffect =
      card.rarity === CardRarityEnum.MYTHIC
        ? 'mythic aura, radiant red-gold energy accents'
        : card.rarity === CardRarityEnum.LEGENDARY
          ? 'legendary glow, golden highlights'
          : card.rarity === CardRarityEnum.EPIC
            ? 'epic energy arcs, vivid accent glow'
            : card.rarity === CardRarityEnum.RARE
              ? 'rare shine, crisp blue accent lighting'
              : 'subtle clean lighting accents';
    return [
      `Cartoon flat-vector football trading card portrait of ${card.playerName},`,
      `${card.nationality} professional football player,`,
      `${card.position},`,
      'clean front-facing symmetrical pose, polished sports avatar illustration,',
      'smooth gradients, thick clean outlines, sticker/avatar aesthetic,',
      'high detail, centered composition, minimal clean background,',
      `${rarityEffect},`,
      '2D vector art, NOT realistic, no text, no watermark, no logo',
    ].join(' ');
  }

  private buildPlaceholderAvatarUrl(card: Card) {
    const bg =
      card.rarity === CardRarityEnum.MYTHIC
        ? 'dc2626'
        : card.rarity === CardRarityEnum.LEGENDARY
          ? 'ca8a04'
          : card.rarity === CardRarityEnum.EPIC
            ? '7c3aed'
            : card.rarity === CardRarityEnum.RARE
              ? '2563eb'
              : '6b7280';
    const name = encodeURIComponent(card.playerName);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=512&bold=true`;
  }
}
