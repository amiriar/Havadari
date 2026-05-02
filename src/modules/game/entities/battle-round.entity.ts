import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Battle } from './battle.entity';

@Entity('battle_rounds')
export class BattleRound extends ApplicationBaseEntity {
  @ManyToOne(() => Battle, (battle) => battle.rounds, { onDelete: 'CASCADE' })
  @JoinColumn()
  battle: Battle;

  @Column({ type: 'int' })
  roundNumber: number;

  @Column({ type: 'varchar', length: 16 })
  category: 'speed' | 'power' | 'skill' | 'attack' | 'defend';

  @Column({ type: 'uuid' })
  player1CardOwnershipId: string;

  @Column({ type: 'int' })
  player1Stat: number;

  @Column({ type: 'int' })
  player2Stat: number;

  @Column({ type: 'varchar', length: 8 })
  winner: 'player1' | 'player2' | 'draw';
}
