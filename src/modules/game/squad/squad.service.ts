import { User } from '@app/auth/entities/user.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdateSquadDto } from '../dto';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class SquadService {
  constructor(
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  async getSquad(user: User) {
    await this.bootstrap.ensureProfile(user);
    const squad = await this.userCardRepo.find({
      where: { user: { id: user.id }, isInDeck: true },
      relations: ['card'],
      order: { updatedAt: 'DESC' },
    });
    return squad.map((item) => ({ ownershipId: item.id, card: item.card }));
  }

  async updateSquad(user: User, dto: UpdateSquadDto) {
    if (dto.cardOwnershipIds.length > 5) {
      throw new BadRequestException('squad size cannot exceed 5 cards');
    }

    const cards = await this.userCardRepo.find({
      where: {
        id: In(dto.cardOwnershipIds),
        user: { id: user.id },
      },
    });

    if (cards.length !== dto.cardOwnershipIds.length) {
      throw new BadRequestException('some cards do not belong to user');
    }

    await this.userCardRepo.update(
      { user: { id: user.id } },
      { isInDeck: false },
    );
    await this.userCardRepo.update(
      { id: In(dto.cardOwnershipIds), user: { id: user.id } },
      { isInDeck: true },
    );

    return this.getSquad(user);
  }
}
