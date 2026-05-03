import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('market_trades')
export class MarketTrade extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  seller: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  buyer: User | null;

  @ManyToOne(() => UserCard, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  userCard: UserCard | null;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', default: 0 })
  platformFee: number;

  @Column({ type: 'int', default: 0 })
  sellerReceive: number;
}

