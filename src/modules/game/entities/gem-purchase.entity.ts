import { User } from '@app/auth/entities/user.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('gem_purchases')
export class GemPurchase extends ApplicationBaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ type: 'int' })
  gems: number;

  @Column({ type: 'int', nullable: true })
  priceToman: number | null;

  @Column({ type: 'varchar', length: 24, default: 'manual' })
  source: string;
}
