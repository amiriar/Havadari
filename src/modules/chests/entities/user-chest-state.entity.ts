import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('user_chest_states')
export class UserChestState extends ApplicationBaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'timestamp', nullable: true })
  rareChestCooldownUntil: Date | null;

  @Column({ type: 'int', default: 0 })
  rareToEpicCounter: number;

  @Column({ type: 'int', default: 0 })
  epicToLegendaryCounter: number;

  @Column({ type: 'int', default: 0 })
  totalOpensCounter: number;
}

