import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Player } from './player.entity';

@Entity('player_stat_snapshots')
@Index(['player', 'season'], { unique: true })
export class PlayerStatSnapshot extends ApplicationBaseEntity {
  @ManyToOne(() => Player, (player) => player.statSnapshots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  player: Player;

  @Column({ type: 'int' })
  season: number;

  @Column({ type: 'int', default: 0 })
  appearances: number;

  @Column({ type: 'int', default: 0 })
  minutes: number;

  @Column({ type: 'int', default: 0 })
  goals: number;

  @Column({ type: 'int', default: 0 })
  assists: number;

  @Column({ type: 'int', default: 0 })
  shots: number;

  @Column({ type: 'int', default: 0 })
  passes: number;

  @Column({ type: 'int', default: 0 })
  tackles: number;

  @Column({ type: 'int', default: 0 })
  interceptions: number;

  @Column({ type: 'int', default: 0 })
  dribbles: number;

  @Column({ type: 'int', default: 0 })
  yellowCards: number;

  @Column({ type: 'int', default: 0 })
  redCards: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  rating: number | null;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;
}
