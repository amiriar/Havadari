import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('reports')
export class Report extends ApplicationBaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  photoUrl: string | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;
}

