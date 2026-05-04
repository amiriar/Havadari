import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('clans')
@Index(['name'], { unique: true })
@Index(['inviteCode'], { unique: true })
export class ClanEntity extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'varchar', length: 12 })
  inviteCode: string;

  @Column({ type: 'int', default: 30 })
  maxMembers: number;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
