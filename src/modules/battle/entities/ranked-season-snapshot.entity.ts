import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RankedSeason } from './ranked-season.entity';

@Entity('ranked_season_snapshots')
@Index(['season', 'user'], { unique: true })
export class RankedSeasonSnapshot extends ApplicationBaseEntity {
  @ManyToOne(() => RankedSeason, { onDelete: 'CASCADE' })
  @JoinColumn()
  season: RankedSeason;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int', default: 0 })
  rankPointsBeforeReset: number;

  @Column({ type: 'int', default: 0 })
  rankPointsAfterReset: number;

  @Column({ type: 'varchar', length: 32 })
  tierKey: string;

  @Column({ type: 'jsonb', nullable: true })
  rewardSnapshot: Record<string, unknown> | null;

  @Column({ type: 'timestamp', nullable: true })
  rewardClaimedAt: Date | null;
}
