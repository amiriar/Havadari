import { User } from '@app/auth/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from '../entities/card.entity';
import { ChestOpening } from '../entities/chest-opening.entity';
import { GemPurchase } from '../entities/gem-purchase.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class ChestsService {
  private readonly chestCosts: Record<string, { fgc?: number; gem?: number }> =
    {
      common_chest: { fgc: 300 },
      rare_chest: { fgc: 900, gem: 40 },
      epic_chest: { gem: 100 },
      legendary_chest: { gem: 250 },
      world_cup_chest: { gem: 180 },
      sponsor_chest: {},
    };

  constructor(
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(ChestOpening)
    private readonly openingRepo: Repository<ChestOpening>,
    @InjectRepository(GemPurchase)
    private readonly purchaseRepo: Repository<GemPurchase>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  getChests() {
    return this.chestCosts;
  }

  async openChest(user: User, chestType: string) {
    const profile = await this.bootstrap.ensureProfile(user);
    const cost = this.chestCosts[chestType];
    if (!cost) throw new BadRequestException('invalid chest type');

    if (cost.fgc && profile.fgc < cost.fgc)
      throw new BadRequestException('insufficient FGC');
    if (cost.gem && profile.gems < cost.gem)
      throw new BadRequestException('insufficient gems');

    profile.fgc -= cost.fgc || 0;
    profile.gems -= cost.gem || 0;
    await this.profileRepo.save(profile);

    const cards = await this.cardRepo.find({
      order: { overallRating: 'DESC' },
      take: 10,
    });
    const selected =
      cards[Math.floor(Math.random() * Math.max(1, cards.length))];

    let ownership: UserCard | null = null;
    if (selected) {
      ownership = this.userCardRepo.create({ user, card: selected, level: 1 });
      await this.userCardRepo.save(ownership);
    }

    const rewards = selected
      ? { type: 'card', cardId: selected.id, rarity: selected.rarity }
      : { type: 'FGC', amount: 100 };

    const opening = this.openingRepo.create({ user, chestType, rewards });
    await this.openingRepo.save(opening);

    return {
      chestType,
      rewards,
      balance: { FGC: profile.fgc, gems: profile.gems },
      ownershipId: ownership?.id,
    };
  }

  async purchaseGems(user: User, gems: number) {
    if (!gems || gems < 1) throw new BadRequestException('invalid gems amount');
    const profile = await this.bootstrap.ensureProfile(user);
    profile.gems += gems;
    await this.profileRepo.save(profile);
    const purchase = this.purchaseRepo.create({
      user,
      gems,
      source: 'manual',
      priceToman: null,
    });
    await this.purchaseRepo.save(purchase);
    return { gems: profile.gems, purchaseId: purchase.id };
  }

  async getPurchaseHistory(user: User) {
    return this.purchaseRepo.find({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
