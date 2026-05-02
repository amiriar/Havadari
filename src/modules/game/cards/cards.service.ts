import { User } from '@app/auth/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  async getUserCards(user: User) {
    await this.bootstrap.ensureProfile(user);
    const cards = await this.userCardRepo.find({
      where: { user: { id: user.id } },
      relations: ['card'],
      order: { createdAt: 'DESC' },
    });

    return cards.map((item) => ({
      ownershipId: item.id,
      level: item.level,
      isInDeck: item.isInDeck,
      isListed: item.isListed,
      listedPrice: item.listedPrice,
      card: item.card,
    }));
  }
}
