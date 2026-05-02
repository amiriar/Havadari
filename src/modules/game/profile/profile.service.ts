import { User } from '@app/auth/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(GameProfile)
    private readonly profileRepo: Repository<GameProfile>,
    @InjectRepository(UserCard)
    private readonly userCardRepo: Repository<UserCard>,
    private readonly bootstrap: GameBootstrapService,
  ) {}

  async getProfile(user: User) {
    const profile = await this.bootstrap.ensureProfile(user);
    return {
      username: user.userName,
      level: profile.level,
      exp: profile.exp,
      trophies: profile.trophies,
      FGC: profile.fgc,
      gems: profile.gems,
      country: profile.country,
      joinDate: user.createdAt,
    };
  }

  async updateProfile(user: User, payload: { country?: string }) {
    const profile = await this.bootstrap.ensureProfile(user);
    if (payload.country) profile.country = payload.country;
    await this.profileRepo.save(profile);
    return this.getProfile(user);
  }

  async getStats(user: User) {
    const profile = await this.bootstrap.ensureProfile(user);
    const cards = await this.userCardRepo.find({
      where: { user: { id: user.id } },
      relations: ['card'],
    });

    const totalCards = cards.length;
    const highestRating = cards.length
      ? Math.max(...cards.map((item) => item.card.overallRating))
      : 0;
    const cardsValue = cards.reduce(
      (sum, item) => sum + item.card.baseValue,
      0,
    );

    return {
      totalCards,
      highestRating,
      cardsValue,
      trophies: profile.trophies,
      level: profile.level,
    };
  }
}
