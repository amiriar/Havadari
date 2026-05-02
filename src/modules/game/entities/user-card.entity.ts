import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Card } from './card.entity';

@Entity('user_cards')
export class UserCard extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Card, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  card: Card;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'boolean', default: false })
  isInDeck: boolean;

  @Column({ type: 'boolean', default: false })
  isListed: boolean;

  @Column({ type: 'int', nullable: true })
  listedPrice: number | null;
}
