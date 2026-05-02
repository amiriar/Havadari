import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity()
export class PermissionCategory extends ApplicationBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column()
  translatedTitle: string;

  @OneToMany(() => Permission, (permission: Permission) => permission.category)
  permissions: Array<Permission>;
}
