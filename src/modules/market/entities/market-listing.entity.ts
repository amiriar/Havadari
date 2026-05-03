import { User } from '@app/auth/entities/user.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ListingStatus } from '../constants/market.types';
import { ListingStatusEnum } from '../constants/listing-status.enum';

@Entity('market_listings')
@Index(['status', 'expiresAt'])
export class MarketListing extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  seller: User;

  @ManyToOne(() => UserCard, { onDelete: 'CASCADE' })
  @JoinColumn()
  userCard: UserCard;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', default: 0 })
  listingFee: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: ListingStatusEnum,
    default: ListingStatusEnum.ACTIVE,
  })
  status: ListingStatus;
}
