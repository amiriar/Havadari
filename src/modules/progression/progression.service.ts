import { User } from '@app/auth/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAdjustProgressionDto } from './dto/admin-adjust-progression.dto';

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

  async adminGet(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return {
      userId: user.id,
      level: Number(user.level || 1),
      exp: Number(user.exp || 0),
      trophies: Number(user.trophies || 0),
      requiredExpForNextLevel: this.requiredExpForLevel(Number(user.level || 1)),
    };
  }

  async adminAdjust(userId: string, dto: AdminAdjustProgressionDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    if (dto.setLevel !== undefined) {
      user.level = Math.max(1, Math.floor(dto.setLevel));
    }
    if (dto.setExp !== undefined) {
      user.exp = Math.max(0, Math.floor(dto.setExp));
    }
    if (dto.expDelta !== undefined && dto.expDelta > 0) {
      user.exp = Number(user.exp || 0) + Math.floor(dto.expDelta);
      while (user.exp >= this.requiredExpForLevel(user.level)) {
        user.exp -= this.requiredExpForLevel(user.level);
        user.level += 1;
      }
    }
    if (dto.trophiesDelta !== undefined && dto.trophiesDelta !== 0) {
      user.trophies = Math.max(
        0,
        Number(user.trophies || 0) + Math.floor(dto.trophiesDelta),
      );
    }

    await this.userRepo.save(user);
    return {
      userId: user.id,
      level: user.level,
      exp: user.exp,
      trophies: user.trophies,
      requiredExpForNextLevel: this.requiredExpForLevel(user.level),
    };
  }

  private requiredExpForLevel(level: number) {
    return Math.max(100, level * 500);
  }
}
