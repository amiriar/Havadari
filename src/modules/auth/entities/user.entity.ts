import { SmsEntity } from '@app/sms/entities/sms.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { IFileOwner } from '@common/interfaces/file-owner.interface';
import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity()
@Index(['fullName'])
export class User extends ApplicationBaseEntity implements IFileOwner {
  @Column({ unique: true, nullable: true })
  userName: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ unique: true, nullable: true })
  nationalCode: string;

  @Column({ unique: true, nullable: true })
  phoneNumber: string;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];

  @ManyToMany(() => Role, { cascade: true })
  @JoinTable()
  roles: Role[];

  @OneToMany(() => SmsEntity, (sms) => sms.user)
  sms: SmsEntity[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar: string;

  signature: string;

  getName(): string {
    return User.name;
  }

  getId(): string {
    return this.id;
  }

  @Column({ type: 'int', default: 0 })
  rankPoints: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 0 })
  exp: number;

  @Column({ type: 'int', default: 0 })
  trophies: number;

  @Column({ type: 'int', default: 1000 })
  fgc: number;

  @Column({ type: 'int', default: 100 })
  gems: number;

  @Column({ type: 'int', default: 0 })
  loginStreak: number;

  @Column({ type: 'date', nullable: true })
  lastLoginDate: string | null;

  permissionsSet: string[];
}
