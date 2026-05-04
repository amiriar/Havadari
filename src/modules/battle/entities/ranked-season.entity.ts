import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('ranked_seasons')
@Index(['seasonKey'], { unique: true })
export class RankedSeason extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32 })
  seasonKey: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  rewardsDistributedAt: Date | null;
}
