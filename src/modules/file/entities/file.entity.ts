import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, ManyToOne } from 'typeorm';

@Entity()
export class File extends ApplicationBaseEntity {
  @Column()
  url: string;

  @Column()
  path: string;

  @Column({ nullable: true })
  title: string;

  @Column()
  mimeType: string;

  @Column()
  relationType: string;

  @Index()
  @Column()
  relatedEntity: string;

  @Index()
  @Column('uuid')
  relatedId: string;

  @ManyToOne(() => User, { nullable: true })
  uploader: User;
  @Column('uuid', { nullable: true })
  uploaderId: string;
}

