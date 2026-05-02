import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('chest_definitions')
@Index(['type'], { unique: true })
export class ChestDefinitionEntity extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32 })
  type: string;

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

