import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { PredictionBetStatusEnum } from '../constants/prediction.enums';
import { PredictionMatch } from './prediction-match.entity';

@Entity('prediction_bets')
@Index(['user', 'match'])
export class PredictionBet extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => PredictionMatch, { onDelete: 'CASCADE' })
  @JoinColumn()
  match: PredictionMatch;

  @Column({ type: 'varchar', length: 64 })
  optionKey: string;

  @Column({ type: 'int' })
  stakeFgc: number;

  @Column({ type: 'numeric', precision: 8, scale: 3 })
  lockedOdds: string;

  @Column({ type: 'enum', enum: PredictionBetStatusEnum, default: PredictionBetStatusEnum.PENDING })
  status: PredictionBetStatusEnum;

  @Column({ type: 'int', default: 0 })
  payoutFgc: number;

  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date | null;
}

