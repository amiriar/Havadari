import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import { PredictionMatchStatusEnum } from '../constants/prediction.enums';

@Entity('prediction_matches')
@Index(['startsAt'])
export class PredictionMatch extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 64, unique: true })
  externalMatchId: string;

  @Column({ type: 'varchar', length: 120 })
  homeTeam: string;

  @Column({ type: 'varchar', length: 120 })
  awayTeam: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  lockAt: Date;

  @Column({ type: 'enum', enum: PredictionMatchStatusEnum, default: PredictionMatchStatusEnum.DRAFT })
  status: PredictionMatchStatusEnum;

  @Column({ type: 'varchar', length: 64, nullable: true })
  resultOptionKey: string | null;

  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date | null;
}

