import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PredictionMatch } from './prediction-match.entity';

@Entity('prediction_settlement_logs')
@Index(['match'], { unique: true })
export class PredictionSettlementLog extends ApplicationBaseEntity {
  @ManyToOne(() => PredictionMatch, { onDelete: 'CASCADE' })
  @JoinColumn()
  match: PredictionMatch;

  @Column({ type: 'int', default: 0 })
  totalBets: number;

  @Column({ type: 'int', default: 0 })
  winningBets: number;

  @Column({ type: 'int', default: 0 })
  totalPayoutFgc: number;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;
}

