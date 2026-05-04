import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Check, Column, Entity, Index } from 'typeorm';

@Entity('daily_login_reward_configs')
@Index(['day'], { unique: true })
@Check(`"day" > 0`)
@Check(`"rewardFgc" >= 0`)
@Check(`"rewardGems" >= 0`)
export class DailyLoginRewardConfig extends ApplicationBaseEntity {
  @Column({ type: 'int' })
  day: number;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;
}
