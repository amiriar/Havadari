import { Card } from '@app/cards/entities/card.entity';
import { User } from '@app/auth/entities/user.entity';
import { AchievementMetricEnum } from '@app/achievements/constants/achievement.enums';
import { AchievementsService } from '@app/achievements/achievements.service';
import { ProgressionService } from '@app/progression/progression.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { SetActiveSquadDto } from '../dto/set-active-squad.dto';
import { UpdateUserSquadDto } from '../dto/update-user-squad.dto';
import { UserCard } from '../entities/user-card.entity';
import { UserCardAcquiredFromEnum } from '../constants/card.enums';
import {
  MAX_CARD_LEVEL,
  UPGRADE_BASE_COST_BY_LEVEL,
  UPGRADE_DUPLICATE_REQUIREMENTS,
  UPGRADE_RARITY_MULTIPLIER,
} from '../constants/upgrade.constants';

@Injectable()
export class UserCardService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly progressionService: ProgressionService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async grantStarterPack(user: User, count = 5) {
    this.assertUser(user);
    const existingCount = await this.userCardRepo.count({
      where: { user: { id: user.id } },
    });
    if (existingCount > 0) {
      throw new BadRequestException(
        'Starter pack already granted for this account.',
      );
    }

    const cards = await this.cardRepo.find({
      order: { overallRating: 'DESC' },
      take: Math.max(5, count),
    });
    if (cards.length < 5) {
      throw new BadRequestException(
        'Not enough cards in catalog. Generate cards first.',
      );
    }

    const selected = cards.slice(0, Math.max(5, count));
    const starterSquadCardIds = this.buildSquadFromCards(selected, true).map(
      (card) => card.id,
    );
    const inserts = selected.map((card, index) =>
      this.userCardRepo.create({
        user,
        card,
        level: 1,
        acquiredFrom: UserCardAcquiredFromEnum.STARTER,
        isInDeck: starterSquadCardIds.includes(card.id),
        isListed: false,
      }),
    );
    await this.userCardRepo.save(inserts);
    await this.achievementsService.track(
      user.id,
      AchievementMetricEnum.COLLECT_CARDS,
      inserts.length,
    );

    return {
      granted: inserts.length,
      inDeck: Math.min(5, starterSquadCardIds.length),
      cards: inserts.map((it) => ({ id: it.id, cardId: it.card.id })),
    };
  }

  async ensureStarterPack(user: User, count = 5) {
    this.assertUser(user);
    const existingCount = await this.userCardRepo.count({
      where: { user: { id: user.id } },
    });
    if (existingCount > 0) {
      return { granted: false, reason: 'already_has_cards' };
    }

    const cardsCount = await this.cardRepo.count();
    if (cardsCount < 5) {
      return { granted: false, reason: 'catalog_not_ready' };
    }

    await this.grantStarterPack(user, count);
    return { granted: true };
  }

  async listMine(user: User, page = 1, limit = 50, url?: string) {
    this.assertUser(user);
    return paginate(
      this.userCardRepo,
      {
        page,
        limit: Math.min(limit, 5000),
        route: url,
      },
      {
        where: { user: { id: user.id } },
        relations: { card: true },
        order: { createdAt: 'ASC' },
      },
    );
  }

  async setActiveSquad(user: User, dto: SetActiveSquadDto) {
    return this.updateSquad(user, {
      userCardIds: dto.userCardIds,
      enforcePositions: true,
    });
  }

  async updateSquad(user: User, dto: UpdateUserSquadDto) {
    this.assertUser(user);
    const mine = await this.userCardRepo.find({
      where: { id: In(dto.userCardIds), user: { id: user.id } },
      relations: { card: true },
    });
    if (mine.length !== dto.userCardIds.length) {
      throw new BadRequestException(
        'Some selected cards are missing or do not belong to this user.',
      );
    }
    if (mine.some((item) => item.isListed)) {
      throw new BadRequestException(
        'Listed cards cannot be put in active squad.',
      );
    }
    const enforcePositions = dto.enforcePositions ?? true;
    if (enforcePositions) {
      this.validatePositionRules(mine);
    }

    await this.userCardRepo.update(
      { user: { id: user.id } },
      { isInDeck: false },
    );
    await this.userCardRepo.update(
      { id: In(dto.userCardIds) },
      { isInDeck: true },
    );

    const updated = await this.userCardRepo.find({
      where: { user: { id: user.id }, isInDeck: true },
      relations: { card: true },
      order: { createdAt: 'ASC' },
    });
    return { squadSize: updated.length, squad: updated };
  }

  async getActiveSquad(user: User) {
    this.assertUser(user);
    return this.userCardRepo.find({
      where: { user: { id: user.id }, isInDeck: true },
      relations: { card: true },
      order: { createdAt: 'ASC' },
    });
  }

  async upgrade(user: User, userCardId: string) {
    this.assertUser(user);
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const userCardRepo = manager.getRepository(UserCard);

      const me = await userRepo.findOne({ where: { id: user.id } });
      if (!me) throw new UnauthorizedException('User not found.');

      const target = await userCardRepo.findOne({
        where: { id: userCardId, user: { id: me.id } },
        relations: { card: true },
      });
      if (!target) throw new BadRequestException('User card not found.');
      if (target.isListed) {
        throw new BadRequestException('Listed cards cannot be upgraded.');
      }
      if (target.level >= MAX_CARD_LEVEL) {
        throw new BadRequestException('Card is already at max level.');
      }

      const nextLevel = target.level + 1;
      const baseCost = UPGRADE_BASE_COST_BY_LEVEL[target.level];
      const rarityMultiplier = UPGRADE_RARITY_MULTIPLIER[target.card.rarity];
      const cost = Math.floor(baseCost * rarityMultiplier);
      if (me.fgc < cost) {
        throw new BadRequestException('Not enough FGC for upgrade.');
      }

      const duplicateRequired = UPGRADE_DUPLICATE_REQUIREMENTS[nextLevel] || 0;
      let consumedDuplicateIds: string[] = [];

      if (duplicateRequired > 0) {
        const duplicates = await userCardRepo.find({
          where: {
            user: { id: me.id },
            card: { id: target.card.id },
            isListed: false,
            isInDeck: false,
          },
          order: { createdAt: 'ASC' },
        });
        const candidates = duplicates
          .filter((d) => d.id !== target.id)
          .slice(0, duplicateRequired);
        if (candidates.length < duplicateRequired) {
          throw new BadRequestException(
            `Upgrade to level ${nextLevel} requires ${duplicateRequired} duplicate cards.`,
          );
        }
        consumedDuplicateIds = candidates.map((d) => d.id);
        await userCardRepo.delete(consumedDuplicateIds);
      }

      target.level = nextLevel;
      me.fgc -= cost;
      await userCardRepo.save(target);
      await userRepo.save(me);
      await this.progressionService.addExp(me.id, 25);
      await this.progressionService.addTrophies(me.id, 2);

      return {
        upgraded: true,
        userCardId: target.id,
        newLevel: target.level,
        spentFgc: cost,
        consumedDuplicates: consumedDuplicateIds,
        balance: { fgc: me.fgc, gems: me.gems },
      };
    });
  }

  async mergeDuplicatesToFgc(user: User, userCardIds: string[]) {
    this.assertUser(user);
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const userCardRepo = manager.getRepository(UserCard);

      const me = await userRepo.findOne({ where: { id: user.id } });
      if (!me) throw new UnauthorizedException('User not found.');

      const cards = await userCardRepo.find({
        where: { id: In(userCardIds), user: { id: me.id } },
        relations: { card: true },
      });
      if (cards.length !== userCardIds.length) {
        throw new BadRequestException(
          'Some cards are missing or do not belong to this user.',
        );
      }
      if (cards.some((c) => c.isListed || c.isInDeck)) {
        throw new BadRequestException(
          'Listed or in-deck cards cannot be merged.',
        );
      }

      const grouped = new Map<string, number>();
      for (const item of cards) {
        const key = item.card.id;
        grouped.set(key, (grouped.get(key) || 0) + 1);
      }
      if ([...grouped.values()].some((count) => count < 2)) {
        throw new BadRequestException(
          'Merge requires duplicate cards (at least 2 copies of same card).',
        );
      }

      const gainedFgc = cards.reduce((sum, item) => {
        const baseValue = Number(item.card.baseValue || 0);
        return sum + Math.floor(baseValue * 0.4);
      }, 0);

      await userCardRepo.delete(cards.map((c) => c.id));
      me.fgc += gainedFgc;
      await userRepo.save(me);
      await this.progressionService.addExp(me.id, 10);

      return {
        merged: true,
        consumed: cards.length,
        gainedFgc,
        balance: { fgc: me.fgc, gems: me.gems },
      };
    });
  }

  private assertUser(user?: User) {
    if (!user?.id) {
      throw new UnauthorizedException('Authentication required.');
    }
  }

  private validatePositionRules(cards: UserCard[]) {
    if (cards.length !== 5) {
      throw new BadRequestException('Squad must contain exactly 5 cards.');
    }
    const counts = { GK: 0, DEF: 0, MID: 0, FW: 0 };
    for (const entry of cards) {
      const pos = entry.card?.position;
      if (!pos || !Object.prototype.hasOwnProperty.call(counts, pos)) {
        throw new BadRequestException(
          'Every squad card must have a valid position.',
        );
      }
      counts[pos] += 1;
    }
    if (
      !(
        counts.GK === 1 &&
        counts.DEF === 1 &&
        counts.MID === 1 &&
        counts.FW === 2
      )
    ) {
      throw new BadRequestException(
        'Invalid squad composition. Required positions: GK=1, DEF=1, MID=1, FW=2.',
      );
    }
  }

  private buildSquadFromCards(
    cards: Card[],
    enforcePositions: boolean,
  ): Card[] {
    if (!enforcePositions) {
      return cards.slice(0, 5);
    }
    const gk = cards.find((c) => c.position === 'GK');
    const def = cards.find((c) => c.position === 'DEF');
    const mid = cards.find((c) => c.position === 'MID');
    const fw = cards.filter((c) => c.position === 'FW').slice(0, 2);
    if (gk && def && mid && fw.length === 2) {
      return [gk, def, mid, ...fw];
    }
    return cards.slice(0, 5);
  }
}
