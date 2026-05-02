import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('cards')
@Index(['playerName', 'rarity'])
export class Card extends ApplicationBaseEntity {
  @Column()
  playerName: string;

  @Column({ nullable: true })
  playerNameFa: string;

  @Column()
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

  @Column({ type: 'varchar', length: 24, default: 'WORLD_CUP_2026' })
  edition: 'WORLD_CUP_2026' | 'CLASSIC' | 'SPECIAL' | 'SPONSOR';

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'int' })
  baseValue: number;
}
