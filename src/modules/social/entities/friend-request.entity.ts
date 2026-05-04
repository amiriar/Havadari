import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { FriendRequestStatusEnum } from '../constants/social.enums';

@Entity('friend_requests')
@Index(['fromUser', 'toUser'])
export class FriendRequestEntity extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  toUser: User;

  @Column({
    type: 'enum',
    enum: FriendRequestStatusEnum,
    default: FriendRequestStatusEnum.PENDING,
  })
  status: FriendRequestStatusEnum;
}

