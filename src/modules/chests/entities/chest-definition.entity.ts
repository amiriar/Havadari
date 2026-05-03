import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import { ChestTypeEnum } from '../constants/chest.types';

@Entity('chest_definitions')
@Index(['type'], { unique: true })
export class ChestDefinitionEntity extends ApplicationBaseEntity {
  @Column({ type: 'enum', enum: ChestTypeEnum })
  type: ChestTypeEnum;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  costFgc: number;

  @Column({ type: 'int', default: 0 })
  costGems: number;

  @Column({ type: 'int', default: 0 })
  cooldownSeconds: number;

  @Column({ type: 'jsonb' })
  drops: Array<Record<string, unknown>>;
}
