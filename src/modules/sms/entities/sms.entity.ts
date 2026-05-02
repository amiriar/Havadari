import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { entityNames } from '@common/enums/entityNames.enum';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SmsStatusType } from '../enums/sms-status.enum';
import { DeliveryStatusType } from '../enums/delivery-status.enum';

@Entity(entityNames.SMS)
export class SmsEntity extends ApplicationBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduleSms: Date;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phoneNumber: string;

  @Column({
    type: 'varchar',
    length: 64,
    enum: SmsStatusType,
    default: SmsStatusType.PENDING,
  })
  status: string;

  @Column({
    type: 'varchar',
    length: 64,
    enum: DeliveryStatusType,
    nullable: true,
  })
  deliveryStatus: string;

  @ManyToOne(() => User, (user) => user.sms)
  user: User;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ nullable: true })
  providerMessageId?: string; // The ID of the message in the SMS provider's system
}
