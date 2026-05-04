import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AchievementDefinition } from './achievement-definition.entity';

@Entity('achievement_claim_logs')
export class AchievementClaimLog extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => AchievementDefinition, { onDelete: 'CASCADE' })
  @JoinColumn()
  achievement: AchievementDefinition;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;

  @Column({ type: 'int', default: 0 })
  rewardTrophies: number;

  @Column({ type: 'int', default: 0 })
  rewardExp: number;
}

