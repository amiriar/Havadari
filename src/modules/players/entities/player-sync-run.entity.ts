import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity } from 'typeorm';
import { PlayerSyncRunStatusEnum } from '../constants/player.enums';

@Entity('player_sync_runs')
export class PlayerSyncRun extends ApplicationBaseEntity {
  @Column({ type: 'int' })
  season: number;

  @Column({
    type: 'enum',
    enum: PlayerSyncRunStatusEnum,
    default: PlayerSyncRunStatusEnum.SUCCESS,
  })
  status: PlayerSyncRunStatusEnum;

  @Column({ type: 'int', default: 0 })
  importedPlayers: number;

  @Column({ type: 'int', default: 0 })
  importedStats: number;

  @Column({ type: 'jsonb', nullable: true })
  diagnostics: unknown;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
