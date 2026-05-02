import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('predictions')
export class Prediction extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  matchId: string;

  @Column()
  type: string;

  @Column()
  value: string;

  @Column({ type: 'int' })
  betAmount: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, default: 1.5 })
  odds: number;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  result: 'win' | 'lose' | 'pending';

  @Column({ type: 'int', nullable: true })
  payout: number | null;
}
