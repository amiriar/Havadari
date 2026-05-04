import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

@Entity('friendships')
@Index(['userA', 'userB'], { unique: true })
export class FriendshipEntity extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  userA: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  userB: User;
}
