import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { PermissionCategory } from './permission-category.entity';

@Entity()
export class Permission extends ApplicationBaseEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  title: string;

  @Column()
  translatedTitle: string;

  @Column()
  guardName: string;

  @Column()
  categoryName: string;

  @ManyToOne(() => PermissionCategory, { cascade: true })
  category: PermissionCategory;
  @Column('uuid')
  categoryId: string;
}
