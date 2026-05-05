import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import { TournamentStatusEnum } from '../constants/tournament.enums';

@Entity('champions_tournaments')
@Index(['seasonKey'], { unique: true })
export class ChampionsTournament extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 32 })
  seasonKey: string;

  @Column({ type: 'enum', enum: TournamentStatusEnum, default: TournamentStatusEnum.REGISTRATION })
  status: TournamentStatusEnum;

  @Column({ type: 'varchar', length: 32, default: 'group' })
  phase: string;

  @Column({ type: 'timestamp' })
  startsAt: Date;

  @Column({ type: 'timestamp' })
  registrationEndsAt: Date;

  @Column({ type: 'timestamp' })
  endsAt: Date;

  @Column({ type: 'int', default: 128 })
  maxParticipants: number;
}
