import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { entityNames } from '@common/enums/entityNames.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';

@Entity(entityNames.NOTIFICATION)
export class NotificationEntity extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'varchar',
    length: 64,
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column('uuid', { nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link?: string;
}
