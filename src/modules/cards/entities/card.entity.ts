import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import {
  AvatarStatusEnum,
  CardEditionEnum,
  CardRarityEnum,
  PlayerPositionEnum,
  PlayerProviderEnum,
} from '../constants/card.enums';

@Entity('cards')
@Index(['sourceProvider', 'sourceProviderPlayerId'], { unique: true })
@Index(['playerName', 'rarity'])
export class Card extends ApplicationBaseEntity {
  @Column({ type: 'enum', enum: PlayerProviderEnum, nullable: true })
  sourceProvider: PlayerProviderEnum | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceProviderPlayerId: string | null;

  @Column({ type: 'varchar', length: 160 })
  playerName: string;

  @Column({ type: 'varchar', length: 64 })
  nationality: string;

  @Column({ type: 'enum', enum: PlayerPositionEnum })
  position: PlayerPositionEnum;

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

  @Column({ type: 'enum', enum: CardRarityEnum })
  rarity: CardRarityEnum;

  @Column({ type: 'enum', enum: CardEditionEnum, default: CardEditionEnum.BASE })
  edition: CardEditionEnum;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @Column({
    type: 'enum',
    enum: AvatarStatusEnum,
    default: AvatarStatusEnum.PENDING,
  })
  avatarStatus: AvatarStatusEnum;

  @Column({ type: 'text', nullable: true })
  avatarPrompt: string | null;

  @Column({ type: 'text', nullable: true })
  avatarError: string | null;

  @Column({ type: 'int' })
  baseValue: number;

  @Column({ type: 'varchar', length: 16, default: 'v1' })
  ratingVersion: string;
}
