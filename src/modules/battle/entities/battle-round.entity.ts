import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  BattleStatCategoryEnum,
  BattleWinnerEnum,
} from '../constants/battle.enums';
import { Battle } from './battle.entity';

@Entity('battle_rounds')
@Index(['battle', 'roundNumber'], { unique: true })
export class BattleRound extends ApplicationBaseEntity {
  @ManyToOne(() => Battle, { onDelete: 'CASCADE' })
  @JoinColumn()
  battle: Battle;

  @Column({ type: 'int' })
  roundNumber: number;

  @Column({ type: 'enum', enum: BattleStatCategoryEnum })
  category: BattleStatCategoryEnum;

  @Column({ type: 'int' })
  player1CardIndex: number;

  @Column({ type: 'int' })
  player2CardIndex: number;

  @Column({ type: 'int' })
  player1Stat: number;

  @Column({ type: 'int' })
  player2Stat: number;

  @Column({ type: 'enum', enum: BattleWinnerEnum })
  winner: BattleWinnerEnum;
}
