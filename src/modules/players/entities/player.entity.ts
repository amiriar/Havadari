import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { PlayerStatSnapshot } from './player-stat-snapshot.entity';

@Entity('players')
@Index(['provider', 'providerPlayerId'], { unique: true })
@Index(['fullName'])
@Index(['teamName'])
export class Player extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  provider: 'football-data' | 'api-football' | 'manual' | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  providerPlayerId: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 96, nullable: true })
  teamName: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  competitionCode: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  position: 'GK' | 'DEF' | 'MID' | 'FW' | null;

  @Column({ type: 'date', nullable: true })
  birthDate: string | null;

  @Column({ type: 'int', nullable: true })
  heightCm: number | null;

  @Column({ type: 'int', nullable: true })
  weightKg: number | null;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;

  @OneToMany(() => PlayerStatSnapshot, (snapshot) => snapshot.player)
  statSnapshots: PlayerStatSnapshot[];
}
