import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity, Index } from 'typeorm';
import { AchievementMetricEnum } from '../constants/achievement.enums';

@Entity('achievement_definitions')
@Index(['code'], { unique: true })
export class AchievementDefinition extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 64 })
  code: string;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: AchievementMetricEnum })
  metric: AchievementMetricEnum;

  @Column({ type: 'int' })
  targetValue: number;

  @Column({ type: 'int', default: 0 })
  rewardFgc: number;

  @Column({ type: 'int', default: 0 })
  rewardGems: number;

  @Column({ type: 'int', default: 0 })
  rewardTrophies: number;

  @Column({ type: 'int', default: 0 })
  rewardExp: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
