import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('chest_open_logs')
export class ChestOpenLog extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', length: 32 })
  chestType: string;

  @Column({ type: 'jsonb' })
  rewards: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  spentFgc: number;

  @Column({ type: 'int', default: 0 })
  spentGems: number;
}

