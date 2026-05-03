import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RankPointSourceEnum } from '../constants/rank-point-source.enum';

@Entity('rank_point_events')
@Index(['user', 'createdAt'])
export class RankPointEvent extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int' })
  delta: number;

  @Column({ type: 'int' })
  before: number;

  @Column({ type: 'int' })
  after: number;

  @Column({ type: 'enum', enum: RankPointSourceEnum })
  source: RankPointSourceEnum;

  @Column({ type: 'varchar', length: 64, nullable: true })
  refId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;
}

