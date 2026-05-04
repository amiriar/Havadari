import { User } from '@app/auth/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProgressionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async addExp(userId: string, amount: number) {
    if (amount <= 0) return null;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    user.exp = Number(user.exp || 0) + Math.floor(amount);
    user.level = Math.max(1, Number(user.level || 1));

    let leveledUp = 0;
    while (user.exp >= this.requiredExpForLevel(user.level)) {
      user.exp -= this.requiredExpForLevel(user.level);
      user.level += 1;
      leveledUp += 1;
    }
    await this.userRepo.save(user);
    return {
      userId: user.id,
      level: user.level,
      exp: user.exp,
      leveledUp,
    };
  }

  async addTrophies(userId: string, delta: number) {
    if (delta === 0) return null;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    user.trophies = Math.max(0, Number(user.trophies || 0) + Math.floor(delta));
    await this.userRepo.save(user);
    return { userId: user.id, trophies: user.trophies };
  }

  private requiredExpForLevel(level: number) {
    return Math.max(100, level * 500);
  }
}

