import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity('daily_login_claims')
@Index(['user', 'claimDate'], { unique: true })
@Check(`"rewardFgc" >= 0`)
@Check(`"rewardGems" >= 0`)
export class DailyLoginClaim extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'date' })
  claimDate: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  claimedAt: Date;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;
}
