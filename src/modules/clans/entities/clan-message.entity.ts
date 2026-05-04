import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ClanEntity } from './clan.entity';

@Entity('clan_messages')
@Index(['clan', 'createdAt'])
export class ClanMessageEntity extends ApplicationBaseEntity {
  @ManyToOne(() => ClanEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  clan: ClanEntity;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  sender: User | null;

  @Column({ type: 'varchar', length: 400 })
  message: string;
}
