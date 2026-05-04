import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ClanRoleEnum } from '../constants/clan.enums';
import { ClanEntity } from './clan.entity';

@Entity('clan_members')
@Index(['clan', 'user'], { unique: true })
export class ClanMemberEntity extends ApplicationBaseEntity {
  @ManyToOne(() => ClanEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  clan: ClanEntity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: ClanRoleEnum, default: ClanRoleEnum.MEMBER })
  role: ClanRoleEnum;
}
