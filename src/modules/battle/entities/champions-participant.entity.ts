import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  TournamentEntryTypeEnum,
  TournamentParticipantStatusEnum,
} from '../constants/tournament.enums';
import { ChampionsTournament } from './champions-tournament.entity';

@Entity('champions_participants')
@Index(['tournament', 'user'], { unique: true })
export class ChampionsParticipant extends ApplicationBaseEntity {
  @ManyToOne(() => ChampionsTournament, { onDelete: 'CASCADE' })
  @JoinColumn()
  tournament: ChampionsTournament;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: TournamentEntryTypeEnum })
  entryType: TournamentEntryTypeEnum;

  @Column({
    type: 'enum',
    enum: TournamentParticipantStatusEnum,
    default: TournamentParticipantStatusEnum.REGISTERED,
  })
  status: TournamentParticipantStatusEnum;

  @Column({ type: 'int', default: 0 })
  groupPoints: number;
}

