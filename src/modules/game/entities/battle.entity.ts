import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BattleRound } from './battle-round.entity';

@Entity('battles')
export class Battle extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 16 })
  type: 'classic' | 'ranked' | 'tournament' | 'duos';

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player1Id' })
  player1: User;

  @Column({ type: 'uuid', nullable: true })
  player2Id: string | null;

  @Column({ type: 'varchar', length: 40, default: 'pending' })
  status: 'pending' | 'started' | 'finished';

  @Column({ type: 'uuid', nullable: true })
  winnerId: string | null;

  @OneToMany(() => BattleRound, (round) => round.battle, { cascade: true })
  rounds: BattleRound[];
}
