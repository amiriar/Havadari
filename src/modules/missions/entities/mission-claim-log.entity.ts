import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { MissionDefinition } from './mission-definition.entity';

@Entity('mission_claim_logs')
export class MissionClaimLog extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => MissionDefinition, { onDelete: 'CASCADE' })
  @JoinColumn()
  mission: MissionDefinition;

  @Column({ type: 'varchar', length: 32 })
  periodKey: string;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;

  @Column({ type: 'int', default: 0 })
  rewardRankPoints: number;
}

