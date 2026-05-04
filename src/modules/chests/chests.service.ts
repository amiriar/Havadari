import { User } from '@app/auth/entities/user.entity';
import { AchievementMetricEnum } from '@app/achievements/constants/achievement.enums';
import { AchievementsService } from '@app/achievements/achievements.service';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { UserCardAcquiredFromEnum } from '@app/cards/constants/card.enums';
import { RankPointsService } from '@app/leaderboard/rank-points.service';
import { RankPointSourceEnum } from '@app/leaderboard/constants/rank-point-source.enum';
import { MissionsService } from '@app/missions/missions.service';
import { MissionMetricEnum } from '@app/missions/constants/mission.enums';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import {
  CardRarityEnum,
  ChestDefinition,
  ChestTypeEnum,
} from './constants/chest.types';
import { ChestDefinitionEntity } from './entities/chest-definition.entity';
import { ChestOpenLog } from './entities/chest-open-log.entity';
import { UserChestInventory } from './entities/user-chest-inventory.entity';
import { UserChestState } from './entities/user-chest-state.entity';

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
    @InjectRepository(UserChestInventory)
    private readonly inventoryRepo: Repository<UserChestInventory>,
    @InjectRepository(ChestOpenLog)
    private readonly logRepo: Repository<ChestOpenLog>,
    @InjectRepository(ChestDefinitionEntity)
    private readonly definitionRepo: Repository<ChestDefinitionEntity>,
    private readonly rankPointsService: RankPointsService,
    private readonly missionsService: MissionsService,
    private readonly progressionService: ProgressionService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async listDefinitions() {
    const defs = await this.definitionRepo.find({
      where: { isActive: true },
      order: { type: 'ASC' },
    });
    return defs.map((d) => this.toDefinition(d));
  }

  async getState(user: User) {
    const authUser = await this.mustUser(user);
    const state = await this.getOrCreateState(authUser);
    const inventoryRows = await this.inventoryRepo.find({
      where: { user: { id: authUser.id } },
      order: { chestType: 'ASC' },
    });
    const inventory = inventoryRows.reduce(
      (acc, row) => {
        acc[row.chestType] = row.quantity;
        return acc;
      },
      {} as Record<string, number>,
    );
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
      inventory,
    };
  }

  async open(user: User, type: ChestTypeEnum) {
    const authUser = await this.mustUser(user);
    const defEntity = await this.definitionRepo.findOne({
      where: { type, isActive: true },
    });
    const def = defEntity ? this.toDefinition(defEntity) : null;
    if (!def) {
      throw new BadRequestException('Invalid chest type.');
    }
    const state = await this.getOrCreateState(authUser);
    this.ensureCooldown(def, state);
    const inventoryRow = await this.inventoryRepo.findOne({
      where: { user: { id: authUser.id }, chestType: type },
    });
    const hasInventory = Boolean(inventoryRow && inventoryRow.quantity > 0);
    if (!hasInventory) {
      this.ensureBalance(authUser, def);
    }

    const pityBefore = {
      rareToEpicCounter: state.rareToEpicCounter,
      epicToLegendaryCounter: state.epicToLegendaryCounter,
      totalOpensCounter: state.totalOpensCounter,
    };
    const reward = await this.rollReward(def, state);
    const rewardPayload: Record<string, unknown> = {};

    if (hasInventory) {
      inventoryRow.quantity -= 1;
      await this.inventoryRepo.save(inventoryRow);
    } else {
      authUser.fgc -= def.cost.fgc || 0;
      authUser.gems -= def.cost.gems || 0;
    }

    if (reward.type === 'card') {
      const card = await this.getRandomCardByRarity(authUser.id, reward.rarity);
      if (!card) {
        state.rareToEpicCounter = pityBefore.rareToEpicCounter;
        state.epicToLegendaryCounter = pityBefore.epicToLegendaryCounter;
        state.totalOpensCounter = pityBefore.totalOpensCounter;
        // Refund full chest spend when no new card is available for the user.
        if (hasInventory) {
          inventoryRow.quantity += 1;
          await this.inventoryRepo.save(inventoryRow);
        } else {
          authUser.fgc += def.cost.fgc || 0;
          authUser.gems += def.cost.gems || 0;
        }
        await this.userRepo.save(authUser);
        return {
          chestType: type,
          spent: hasInventory ? { inventory: 1 } : def.cost,
          refunded: hasInventory ? { inventory: 1 } : def.cost,
          rewards: null,
          reason: `No ${reward.rarity} card found in catalog. Chest cost refunded.`,
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
        acquiredFrom: UserCardAcquiredFromEnum.CHEST,
        isInDeck: false,
        isListed: false,
      });
      await this.userCardRepo.save(userCard);
      await this.achievementsService.track(
        authUser.id,
        AchievementMetricEnum.COLLECT_CARDS,
        1,
      );
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

    if (def.type === ChestTypeEnum.RARE_CHEST && def.cooldownSeconds > 0) {
      state.rareChestCooldownUntil = new Date(
        Date.now() + def.cooldownSeconds * 1000,
      );
    }

    state.totalOpensCounter += 1;
    await this.userRepo.save(authUser);
    await this.stateRepo.save(state);
    await this.logRepo.save(
      this.logRepo.create({
        user: authUser,
        chestType: type,
        rewards: rewardPayload,
        spentFgc: hasInventory ? 0 : def.cost.fgc || 0,
        spentGems: hasInventory ? 0 : def.cost.gems || 0,
      }),
    );
    const rankDelta =
      type === ChestTypeEnum.MYTHIC_CHEST
        ? 12
        : type === ChestTypeEnum.LEGENDARY_CHEST
          ? 8
          : type === ChestTypeEnum.EPIC_CHEST
            ? 5
            : type === ChestTypeEnum.RARE_CHEST
              ? 3
              : type === ChestTypeEnum.SPONSOR_CHEST
                ? 1
                : 1;
    await this.rankPointsService.apply(
      authUser.id,
      rankDelta,
      RankPointSourceEnum.REWARD,
      null,
      { chestType: type },
    );
    await this.missionsService.track(
      authUser.id,
      MissionMetricEnum.OPEN_CHESTS,
      1,
    );
    await this.achievementsService.track(
      authUser.id,
      AchievementMetricEnum.OPEN_CHESTS,
      1,
    );
    await this.progressionService.addExp(
      authUser.id,
      type === ChestTypeEnum.MYTHIC_CHEST
        ? 40
        : type === ChestTypeEnum.LEGENDARY_CHEST
          ? 30
          : type === ChestTypeEnum.EPIC_CHEST
            ? 20
            : type === ChestTypeEnum.RARE_CHEST
              ? 12
              : 8,
    );

    return {
      chestType: type,
      spent: hasInventory ? { inventory: 1 } : def.cost,
      source: hasInventory ? 'inventory' : 'shop',
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
    if (def.type === ChestTypeEnum.RARE_CHEST) {
      state.rareToEpicCounter += 1;
      if (state.rareToEpicCounter >= 20) {
        state.rareToEpicCounter = 0;
        return { type: 'card' as const, rarity: CardRarityEnum.EPIC };
      }
    }
    if (def.type === ChestTypeEnum.EPIC_CHEST) {
      state.epicToLegendaryCounter += 1;
      if (state.epicToLegendaryCounter >= 80) {
        state.epicToLegendaryCounter = 0;
        return { type: 'card' as const, rarity: CardRarityEnum.LEGENDARY };
      }
    }
    if (state.totalOpensCounter + 1 >= 200) {
      state.totalOpensCounter = 0;
      return { type: 'card' as const, rarity: CardRarityEnum.MYTHIC };
    }

    const roll = Math.random();
    let cursor = 0;
    for (const drop of def.drops) {
      cursor += drop.probability;
      if (roll <= cursor) return drop;
    }
    return def.drops[def.drops.length - 1];
  }

  private toDefinition(entity: ChestDefinitionEntity): ChestDefinition {
    return {
      type: entity.type as ChestTypeEnum,
      cost: {
        fgc: entity.costFgc || 0,
        gems: entity.costGems || 0,
      },
      cooldownSeconds: entity.cooldownSeconds || 0,
      drops: (entity.drops || []) as ChestDefinition['drops'],
    };
  }

  private async getRandomCardByRarity(_userId: string, rarity: CardRarityEnum) {
    const cards = await this.cardRepo.find({ where: { rarity }, take: 500 });
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
    if (def.type !== ChestTypeEnum.RARE_CHEST) return;
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
    const existing = await this.stateRepo.findOne({
      where: { user: { id: user.id } },
    });
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
