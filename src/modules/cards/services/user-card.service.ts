import { Card } from '@app/cards/entities/card.entity';
import { User } from '@app/auth/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { SetActiveSquadDto } from '../dto/set-active-squad.dto';
import { UpdateUserSquadDto } from '../dto/update-user-squad.dto';
import { UserCard } from '../entities/user-card.entity';

@Injectable()
export class UserCardService {
  constructor(
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
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
        acquiredFrom: 'starter',
        isInDeck: starterSquadCardIds.includes(card.id),
        isListed: false,
      }),
    );
    await this.userCardRepo.save(inserts);

    return {
      granted: inserts.length,
      inDeck: Math.min(5, starterSquadCardIds.length),
      cards: inserts.map((it) => ({ id: it.id, cardId: it.card.id })),
    };
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
      throw new BadRequestException('Listed cards cannot be put in active squad.');
    }
    const enforcePositions = dto.enforcePositions ?? true;
    if (enforcePositions) {
      this.validatePositionRules(mine);
    }

    await this.userCardRepo.update({ user: { id: user.id } }, { isInDeck: false });
    await this.userCardRepo.update({ id: In(dto.userCardIds) }, { isInDeck: true });

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
        throw new BadRequestException('Every squad card must have a valid position.');
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

  private buildSquadFromCards(cards: Card[], enforcePositions: boolean): Card[] {
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
