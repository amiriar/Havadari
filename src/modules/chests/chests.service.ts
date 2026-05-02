import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { ChestOpenLog } from './entities/chest-open-log.entity';
import { UserChestState } from './entities/user-chest-state.entity';

type CardRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
type ChestType = 'common_chest' | 'rare_chest' | 'epic_chest' | 'legendary_chest';

type ChestDefinition = {
  type: ChestType;
  cost: { fgc?: number; gems?: number };
  cooldownSeconds: number;
  drops: Array<
    | { type: 'card'; rarity: CardRarity; probability: number }
    | { type: 'fgc'; min: number; max: number; probability: number }
    | { type: 'gems'; min: number; max: number; probability: number }
  >;
};

const CHESTS: ChestDefinition[] = [
  {
    type: 'common_chest',
    cost: { fgc: 300 },
    cooldownSeconds: 0,
    drops: [
      { type: 'card', rarity: 'COMMON', probability: 0.75 },
      { type: 'card', rarity: 'RARE', probability: 0.2 },
      { type: 'fgc', min: 50, max: 200, probability: 0.05 },
    ],
  },
  {
    type: 'rare_chest',
    cost: { fgc: 900, gems: 40 },
    cooldownSeconds: 4 * 60 * 60,
    drops: [
      { type: 'card', rarity: 'RARE', probability: 0.55 },
      { type: 'card', rarity: 'EPIC', probability: 0.35 },
      { type: 'card', rarity: 'LEGENDARY', probability: 0.08 },
      { type: 'gems', min: 10, max: 30, probability: 0.02 },
    ],
  },
  {
    type: 'epic_chest',
    cost: { gems: 100 },
    cooldownSeconds: 0,
    drops: [
      { type: 'card', rarity: 'EPIC', probability: 0.6 },
      { type: 'card', rarity: 'LEGENDARY', probability: 0.3 },
      { type: 'card', rarity: 'MYTHIC', probability: 0.08 },
      { type: 'gems', min: 20, max: 50, probability: 0.02 },
    ],
  },
  {
    type: 'legendary_chest',
    cost: { gems: 250 },
    cooldownSeconds: 0,
    drops: [
      { type: 'card', rarity: 'LEGENDARY', probability: 0.85 },
      { type: 'card', rarity: 'MYTHIC', probability: 0.15 },
    ],
  },
];

@Injectable()
export class ChestsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(UserChestState)
    private readonly stateRepo: Repository<UserChestState>,
    @InjectRepository(ChestOpenLog)
    private readonly logRepo: Repository<ChestOpenLog>,
  ) {}

  listDefinitions() {
    return CHESTS;
  }

  async getState(user: User) {
    const authUser = await this.mustUser(user);
    const state = await this.getOrCreateState(authUser);
    return {
      fgc: authUser.fgc,
      gems: authUser.gems,
      cooldowns: {
        rare_chest: state.rareChestCooldownUntil,
      },
      pity: {
        rareToEpicCounter: state.rareToEpicCounter,
        epicToLegendaryCounter: state.epicToLegendaryCounter,
        totalOpensCounter: state.totalOpensCounter,
      },
    };
  }

  async open(user: User, type: ChestType) {
    const authUser = await this.mustUser(user);
    const def = CHESTS.find((x) => x.type === type);
    if (!def) {
      throw new BadRequestException('Invalid chest type.');
    }
    const state = await this.getOrCreateState(authUser);
    this.ensureCooldown(def, state);
    this.ensureBalance(authUser, def);

    const pityBefore = {
      rareToEpicCounter: state.rareToEpicCounter,
      epicToLegendaryCounter: state.epicToLegendaryCounter,
      totalOpensCounter: state.totalOpensCounter,
    };
    const reward = await this.rollReward(def, state);
    const rewardPayload: Record<string, unknown> = {};

    authUser.fgc -= def.cost.fgc || 0;
    authUser.gems -= def.cost.gems || 0;

    if (reward.type === 'card') {
      const card = await this.getRandomCardByRarity(authUser.id, reward.rarity);
      if (!card) {
        state.rareToEpicCounter = pityBefore.rareToEpicCounter;
        state.epicToLegendaryCounter = pityBefore.epicToLegendaryCounter;
        state.totalOpensCounter = pityBefore.totalOpensCounter;
        // Refund full chest spend when no new card is available for the user.
        authUser.fgc += def.cost.fgc || 0;
        authUser.gems += def.cost.gems || 0;
        await this.userRepo.save(authUser);
        return {
          chestType: type,
          spent: def.cost,
          refunded: def.cost,
          rewards: null,
          reason: `No new ${reward.rarity} card left for this user. Chest cost refunded.`,
          balances: { fgc: authUser.fgc, gems: authUser.gems },
          pity: {
            rareToEpicCounter: state.rareToEpicCounter,
            epicToLegendaryCounter: state.epicToLegendaryCounter,
            totalOpensCounter: state.totalOpensCounter,
          },
        };
      }
      const userCard = this.userCardRepo.create({
        user: authUser,
        card,
        level: 1,
        acquiredFrom: 'chest',
        isInDeck: false,
        isListed: false,
      });
      await this.userCardRepo.save(userCard);
      rewardPayload.card = {
        userCardId: userCard.id,
        cardId: card.id,
        rarity: card.rarity,
        playerName: card.playerName,
      };
    } else if (reward.type === 'fgc') {
      const amount = this.randInt(reward.min, reward.max);
      authUser.fgc += amount;
      rewardPayload.fgc = amount;
    } else {
      const amount = this.randInt(reward.min, reward.max);
      authUser.gems += amount;
      rewardPayload.gems = amount;
    }

    if (def.type === 'rare_chest' && def.cooldownSeconds > 0) {
      state.rareChestCooldownUntil = new Date(Date.now() + def.cooldownSeconds * 1000);
    }

    state.totalOpensCounter += 1;
    await this.userRepo.save(authUser);
    await this.stateRepo.save(state);
    await this.logRepo.save(
      this.logRepo.create({
        user: authUser,
        chestType: type,
        rewards: rewardPayload,
        spentFgc: def.cost.fgc || 0,
        spentGems: def.cost.gems || 0,
      }),
    );

    return {
      chestType: type,
      spent: def.cost,
      rewards: rewardPayload,
      balances: { fgc: authUser.fgc, gems: authUser.gems },
      pity: {
        rareToEpicCounter: state.rareToEpicCounter,
        epicToLegendaryCounter: state.epicToLegendaryCounter,
        totalOpensCounter: state.totalOpensCounter,
      },
    };
  }

  async logs(user: User, page = 1, limit = 20, url?: string) {
    const authUser = await this.mustUser(user);
    return paginate(
      this.logRepo,
      { page, limit: Math.min(limit, 200), route: url },
      { where: { user: { id: authUser.id } }, order: { createdAt: 'DESC' } },
    );
  }

  private async rollReward(def: ChestDefinition, state: UserChestState) {
    if (def.type === 'rare_chest') {
      state.rareToEpicCounter += 1;
      if (state.rareToEpicCounter >= 20) {
        state.rareToEpicCounter = 0;
        return { type: 'card' as const, rarity: 'EPIC' as CardRarity };
      }
    }
    if (def.type === 'epic_chest') {
      state.epicToLegendaryCounter += 1;
      if (state.epicToLegendaryCounter >= 80) {
        state.epicToLegendaryCounter = 0;
        return { type: 'card' as const, rarity: 'LEGENDARY' as CardRarity };
      }
    }
    if (state.totalOpensCounter + 1 >= 200) {
      state.totalOpensCounter = 0;
      return { type: 'card' as const, rarity: 'MYTHIC' as CardRarity };
    }

    const roll = Math.random();
    let cursor = 0;
    for (const drop of def.drops) {
      cursor += drop.probability;
      if (roll <= cursor) return drop;
    }
    return def.drops[def.drops.length - 1];
  }

  private async getRandomCardByRarity(userId: string, rarity: CardRarity) {
    const owned = await this.userCardRepo.find({
      where: { user: { id: userId } },
      relations: { card: true },
      select: { id: true, card: { id: true } },
      take: 20000,
    });
    const ownedCardIds = owned
      .map((it) => it.card?.id)
      .filter((id): id is string => Boolean(id));

    const cards = ownedCardIds.length
      ? await this.cardRepo
          .createQueryBuilder('card')
          .where('card.rarity = :rarity', { rarity })
          .andWhere('card.id NOT IN (:...ownedCardIds)', { ownedCardIds })
          .take(500)
          .getMany()
      : await this.cardRepo.find({ where: { rarity }, take: 500 });
    if (!cards.length) return null;
    return cards[Math.floor(Math.random() * cards.length)];
  }

  private ensureBalance(user: User, def: ChestDefinition) {
    if ((def.cost.fgc || 0) > user.fgc) {
      throw new BadRequestException('Not enough FGC.');
    }
    if ((def.cost.gems || 0) > user.gems) {
      throw new BadRequestException('Not enough gems.');
    }
  }

  private ensureCooldown(def: ChestDefinition, state: UserChestState) {
    if (def.type !== 'rare_chest') return;
    if (
      state.rareChestCooldownUntil &&
      state.rareChestCooldownUntil.getTime() > Date.now()
    ) {
      throw new BadRequestException('Rare chest is on cooldown.');
    }
  }

  private randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private async getOrCreateState(user: User) {
    const existing = await this.stateRepo.findOne({ where: { user: { id: user.id } } });
    if (existing) return existing;
    return this.stateRepo.save(
      this.stateRepo.create({
        user,
        rareChestCooldownUntil: null,
        rareToEpicCounter: 0,
        epicToLegendaryCounter: 0,
        totalOpensCounter: 0,
      }),
    );
  }

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
