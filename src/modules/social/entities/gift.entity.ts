import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { GiftStatusEnum, GiftTypeEnum } from '../constants/social.enums';

@Entity('social_gifts')
@Index(['fromUser', 'toUser', 'createdAt'])
export class GiftEntity extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  fromUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  toUser: User;

  @Column({ type: 'enum', enum: GiftTypeEnum, default: GiftTypeEnum.FGC })
  type: GiftTypeEnum;

  @Column({ type: 'int', default: 0 })
  amountFgc: number;

  @Column({ type: 'varchar', length: 32, nullable: true })
  chestType: string | null;

  @Column({ type: 'enum', enum: GiftStatusEnum, default: GiftStatusEnum.SENT })
  status: GiftStatusEnum;

  @Column({ type: 'timestamp', nullable: true })
  claimedAt: Date | null;
}

