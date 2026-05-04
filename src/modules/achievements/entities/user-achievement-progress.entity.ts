import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { AchievementDefinition } from './achievement-definition.entity';

@Entity('user_achievement_progress')
@Index(['user', 'achievement'], { unique: true })
export class UserAchievementProgress extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => AchievementDefinition, { onDelete: 'CASCADE' })
  @JoinColumn()
  achievement: AchievementDefinition;

  @Column({ type: 'int', default: 0 })
  progressValue: number;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date | null;
}
