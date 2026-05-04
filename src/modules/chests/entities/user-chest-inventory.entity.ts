import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ChestTypeEnum } from '../constants/chest.types';

@Entity('user_chest_inventory')
@Index(['user', 'chestType'], { unique: true })
@Check(`"quantity" >= 0`)
export class UserChestInventory extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: ChestTypeEnum })
  chestType: ChestTypeEnum;

  @Column({ type: 'int', default: 0 })
  quantity: number;
}
