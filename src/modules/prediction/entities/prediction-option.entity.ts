import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PredictionMatch } from './prediction-match.entity';

@Entity('prediction_options')
@Index(['match', 'optionKey'], { unique: true })
export class PredictionOption extends ApplicationBaseEntity {
  @ManyToOne(() => PredictionMatch, { onDelete: 'CASCADE' })
  @JoinColumn()
  match: PredictionMatch;

  @Column({ type: 'varchar', length: 64 })
  optionKey: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}

