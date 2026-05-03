import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import { LeaderboardTypeEnum } from '../constants/leaderboard.enums';

@Entity('leaderboard_rewards')
@Index(['type', 'rankFrom', 'rankTo'], { unique: true })
export class LeaderboardReward extends ApplicationBaseEntity {
  @Column({ type: 'enum', enum: LeaderboardTypeEnum })
  type: LeaderboardTypeEnum;

  @Column({ type: 'int' })
  rankFrom: number;

  @Column({ type: 'int' })
  rankTo: number;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;

  @Column({ type: 'varchar', length: 64, nullable: true })
  rewardChest: string | null;
}
