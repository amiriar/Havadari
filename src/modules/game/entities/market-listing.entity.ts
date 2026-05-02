import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UserCard } from './user-card.entity';

@Entity('market_listings')
export class MarketListing extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  seller: User;

  @ManyToOne(() => UserCard, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  userCard: UserCard;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: 'active' | 'sold' | 'expired' | 'cancelled';
}
