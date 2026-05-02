import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('player_sync_runs')
export class PlayerSyncRun extends ApplicationBaseEntity {
  @Column({ type: 'int' })
  season: number;

  @Column({ type: 'varchar', length: 16, default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED';

  @Column({ type: 'int', default: 0 })
  importedPlayers: number;

  @Column({ type: 'int', default: 0 })
  importedStats: number;

  @Column({ type: 'jsonb', nullable: true })
  diagnostics: unknown;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}

