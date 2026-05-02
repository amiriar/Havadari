import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('cards')
@Index(['sourceProvider', 'sourceProviderPlayerId'], { unique: true })
@Index(['playerName', 'rarity'])
export class Card extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  sourceProvider: 'football-data' | 'api-football' | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceProviderPlayerId: string | null;

  @Column({ type: 'varchar', length: 160 })
  playerName: string;

  @Column({ type: 'varchar', length: 64 })
  nationality: string;

  @Column({ type: 'varchar', length: 4 })
  position: 'GK' | 'DEF' | 'MID' | 'FW';

  @Column({ type: 'int' })
  overallRating: number;

  @Column({ type: 'int' })
  speed: number;

  @Column({ type: 'int' })
  power: number;

  @Column({ type: 'int' })
  skill: number;

  @Column({ type: 'int' })
  attack: number;

  @Column({ type: 'int' })
  defend: number;

  @Column({ type: 'varchar', length: 16 })
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

  @Column({ type: 'varchar', length: 24, default: 'BASE' })
  edition: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  avatarStatus: 'PENDING' | 'GENERATED' | 'FAILED';

  @Column({ type: 'text', nullable: true })
  avatarPrompt: string | null;

  @Column({ type: 'text', nullable: true })
  avatarError: string | null;

  @Column({ type: 'int' })
  baseValue: number;
}

