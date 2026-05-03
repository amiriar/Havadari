import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity } from 'typeorm';
import { AvatarGenerationRunStatusEnum } from '../constants/card.enums';

@Entity('avatar_generation_runs')
export class AvatarGenerationRun extends ApplicationBaseEntity {
  @Column({ type: 'int', default: 0 })
  requestedCount: number;

  @Column({ type: 'int', default: 0 })
  generatedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({
    type: 'enum',
    enum: AvatarGenerationRunStatusEnum,
    default: AvatarGenerationRunStatusEnum.SUCCESS,
  })
  status: AvatarGenerationRunStatusEnum;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
