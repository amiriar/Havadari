import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Card } from './card.entity';
import { UserCardAcquiredFromEnum } from '../constants/card.enums';

@Entity('user_cards')
@Index(['user', 'isInDeck'])
@Check(`NOT ("isInDeck" = true AND "isListed" = true)`)
export class UserCard extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Card, { onDelete: 'CASCADE' })
  @JoinColumn()
  card: Card;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({
    type: 'enum',
    enum: UserCardAcquiredFromEnum,
    default: UserCardAcquiredFromEnum.STARTER,
  })
  acquiredFrom: UserCardAcquiredFromEnum;

  @Column({ type: 'boolean', default: false })
  isInDeck: boolean;

  @Column({ type: 'boolean', default: false })
  isListed: boolean;
}
