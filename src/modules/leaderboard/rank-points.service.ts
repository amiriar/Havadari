import { User } from '@app/auth/entities/user.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { RankPointSourceEnum } from './constants/rank-point-source.enum';
import { RankPointEvent } from './entities/rank-point-event.entity';

@Injectable()
export class RankPointsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RankPointEvent)
    private readonly eventRepo: Repository<RankPointEvent>,
  ) {}

  async apply(
    userId: string,
    delta: number,
    source: RankPointSourceEnum,
    refId?: string | null,
    meta?: Record<string, unknown> | null,
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    const before = user.rankPoints || 0;
    const after = Math.max(0, before + delta);
    const normalizedDelta = after - before;
    user.rankPoints = after;
    await this.userRepo.save(user);
    const event = this.eventRepo.create({
      user,
      delta: normalizedDelta,
      before,
      after,
      source,
      refId: refId ?? null,
      meta: meta ?? null,
    });
    await this.eventRepo.save(event);
    return { userId, before, after, delta: normalizedDelta, source };
  }

  async history(userId: string, page = 1, limit = 20, url?: string) {
    if (!userId) {
      return paginate(
        this.eventRepo,
        { page, limit: Math.min(limit, 200), route: url },
        {
          relations: { user: true },
          order: { createdAt: 'DESC' },
        },
      );
    }
    return paginate(
      this.eventRepo,
      { page, limit: Math.min(limit, 200), route: url },
      { where: { user: { id: userId } }, order: { createdAt: 'DESC' } },
    );
  }
}
