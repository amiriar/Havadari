import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { MissionDefinition } from './mission-definition.entity';

@Entity('user_mission_progress')
@Index(['user', 'mission', 'periodKey'], { unique: true })
export class UserMissionProgress extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => MissionDefinition, { onDelete: 'CASCADE' })
  @JoinColumn()
  mission: MissionDefinition;

  @Column({ type: 'varchar', length: 32 })
  periodKey: string;

  @Column({ type: 'int', default: 0 })
  progressValue: number;

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date | null;
}
