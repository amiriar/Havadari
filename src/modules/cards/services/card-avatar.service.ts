import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AvatarGenerationRun } from '../entities/avatar-generation-run.entity';
import { Card } from '../entities/card.entity';

@Injectable()
export class CardAvatarService {
  private readonly logger = new Logger(CardAvatarService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(AvatarGenerationRun)
    private readonly runRepo: Repository<AvatarGenerationRun>,
  ) {}

  @Cron('0 */5 * * * *')
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
      card.avatarStatus = 'PENDING';
      if (!card.avatarPrompt) card.avatarPrompt = this.buildPrompt(card);
      await this.cardRepo.save(card);
    }
    return { queued: cards.length };
  }

  async regenerate(cardId: string) {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) throw new NotFoundException('card not found');
    card.avatarStatus = 'PENDING';
    card.avatarError = null;
    card.avatarPrompt = this.buildPrompt(card);
    await this.cardRepo.save(card);
    return { queued: 1, cardId };
  }

  async processQueue(limit = 25) {
    const pending = await this.cardRepo.find({
      where: { avatarStatus: 'PENDING' },
      order: { updatedAt: 'ASC' },
      take: Math.min(200, limit),
    });
    if (!pending.length) return { requested: 0, generated: 0, failed: 0 };

    const run = this.runRepo.create({
      requestedCount: pending.length,
      generatedCount: 0,
      failedCount: 0,
      status: 'SUCCESS',
      message: null,
    });
    await this.runRepo.save(run);

    for (const card of pending) {
      try {
        const prompt = card.avatarPrompt || this.buildPrompt(card);
        // Hook point for real AI model integration
        const generatedUrl = this.buildPlaceholderAvatarUrl(card);
        card.avatarPrompt = prompt;
        card.avatarUrl = generatedUrl;
        card.avatarStatus = 'GENERATED';
        card.avatarError = null;
        await this.cardRepo.save(card);
        run.generatedCount += 1;
      } catch (error) {
        card.avatarStatus = 'FAILED';
        card.avatarError = error instanceof Error ? error.message : String(error);
        await this.cardRepo.save(card);
        run.failedCount += 1;
      }
    }

    if (run.failedCount > 0) {
      run.status = 'FAILED';
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

  private buildPrompt(card: Card) {
    return `Cartoon football trading card portrait, ${card.playerName}, ${card.nationality}, ${card.position}, ${card.rarity} rarity style, clean background, high contrast`;
  }

  private buildPlaceholderAvatarUrl(card: Card) {
    const bg =
      card.rarity === 'MYTHIC'
        ? 'dc2626'
        : card.rarity === 'LEGENDARY'
          ? 'ca8a04'
          : card.rarity === 'EPIC'
            ? '7c3aed'
            : card.rarity === 'RARE'
              ? '2563eb'
              : '6b7280';
    const name = encodeURIComponent(card.playerName);
    return `https://ui-avatars.com/api/?name=${name}&background=${bg}&color=fff&size=512&bold=true`;
  }
}

