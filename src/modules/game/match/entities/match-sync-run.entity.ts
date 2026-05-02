import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('match_sync_runs')
export class MatchSyncRun extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32 })
  provider: string;

  @Column({ type: 'varchar', length: 16, default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED';

  @Column({ type: 'int', default: 0 })
  fetchedCount: number;

  @Column({ type: 'int', default: 0 })
  insertedCount: number;

  @Column({ type: 'int', default: 0 })
  updatedCount: number;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;
}
