import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class Role extends ApplicationBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: 'api' })
  guardName: string;

  @Column({ type: 'date', nullable: true })
  expireDate: Date;

  @ManyToMany(() => Permission)
  @JoinTable()
  permissions: Permission[];
}

