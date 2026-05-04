import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import {
  BattleModeEnum,
  BattleOpponentTypeEnum,
  BattleRegionEnum,
  BattleStatusEnum,
  BattleStatCategoryEnum,
  BattleWinnerEnum,
} from '../constants/battle.enums';

@Entity('battles')
export class Battle extends ApplicationBaseEntity {
  @Column({
    type: 'enum',
    enum: BattleModeEnum,
    default: BattleModeEnum.CLASSIC,
  })
  mode: BattleModeEnum;

  @Column({
    type: 'enum',
    enum: BattleStatusEnum,
    default: BattleStatusEnum.IN_PROGRESS,
  })
  status: BattleStatusEnum;

  @Column({ type: 'enum', enum: BattleOpponentTypeEnum })
  opponentType: BattleOpponentTypeEnum;

  @Column({
    type: 'enum',
    enum: BattleRegionEnum,
    default: BattleRegionEnum.GLOBAL,
  })
  region: BattleRegionEnum;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  player1: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  player2: User | null;

  @Column({ type: 'jsonb' })
  player1Squad: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb' })
  player2Squad: Array<Record<string, unknown>>;

  @Column({ type: 'jsonb' })
  categories: BattleStatCategoryEnum[];

  @Column({ type: 'int', default: 0 })
  currentRound: number;

  @Column({ type: 'int', default: 0 })
  player1RoundWins: number;

  @Column({ type: 'int', default: 0 })
  player2RoundWins: number;

  @Column({ type: 'enum', enum: BattleWinnerEnum, nullable: true })
  winner: BattleWinnerEnum | null;

  @Column({ type: 'jsonb', nullable: true })
  rewards: Record<string, unknown> | null;
}
