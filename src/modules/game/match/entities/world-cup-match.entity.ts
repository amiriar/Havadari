import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('world_cup_matches')
@Index(['provider', 'providerMatchId'], { unique: true })
@Index(['matchDateUtc'])
export class WorldCupMatch extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32 })
  provider: 'football-data' | 'api-football';

  @Column({ type: 'varchar', length: 64 })
  providerMatchId: string;

  @Column({ type: 'varchar', length: 128 })
  homeTeam: string;

  @Column({ type: 'varchar', length: 128 })
  awayTeam: string;

  @Column({ type: 'timestamptz' })
  matchDateUtc: Date;

  @Column({ type: 'varchar', length: 128, nullable: true })
  venue: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  stage: string | null;

  @Column({ type: 'varchar', length: 32, default: 'SCHEDULED' })
  status: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  groupName: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  winner: string | null;

  @Column({ type: 'varchar', length: 64 })
  checksum: string;

  @Column({ type: 'timestamptz' })
  lastSyncedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  rawPayload: Record<string, unknown> | null;
}
