import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  TournamentMatchStageEnum,
  TournamentMatchStatusEnum,
} from '../constants/tournament-match.enums';
import { ChampionsParticipant } from './champions-participant.entity';
import { ChampionsTournament } from './champions-tournament.entity';

@Entity('champions_matches')
@Index(['tournament', 'stage', 'roundNo'])
export class ChampionsMatch extends ApplicationBaseEntity {
  @ManyToOne(() => ChampionsTournament, { onDelete: 'CASCADE' })
  @JoinColumn()
  tournament: ChampionsTournament;

  @ManyToOne(() => ChampionsParticipant, { onDelete: 'CASCADE' })
  @JoinColumn()
  participantA: ChampionsParticipant;

  @ManyToOne(() => ChampionsParticipant, { onDelete: 'CASCADE' })
  @JoinColumn()
  participantB: ChampionsParticipant;

  @ManyToOne(() => ChampionsParticipant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  winner: ChampionsParticipant | null;

  @Column({ type: 'enum', enum: TournamentMatchStageEnum })
  stage: TournamentMatchStageEnum;

  @Column({ type: 'enum', enum: TournamentMatchStatusEnum, default: TournamentMatchStatusEnum.PENDING })
  status: TournamentMatchStatusEnum;

  @Column({ type: 'int', default: 1 })
  roundNo: number;

  @Column({ type: 'int', nullable: true })
  groupNo: number | null;

  @Column({ type: 'int', default: 0 })
  scoreA: number;

  @Column({ type: 'int', default: 0 })
  scoreB: number;
}

