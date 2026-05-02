import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('game_profiles')
export class GameProfile extends ApplicationBaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 0 })
  exp: number;

  @Column({ type: 'int', default: 0 })
  trophies: number;

  @Column({ type: 'int', default: 1000 })
  fgc: number;

  @Column({ type: 'int', default: 0 })
  gems: number;

  @Column({ type: 'varchar', length: 16, default: 'IR' })
  country: string;
}
