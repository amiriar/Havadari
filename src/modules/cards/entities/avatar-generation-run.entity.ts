import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('avatar_generation_runs')
export class AvatarGenerationRun extends ApplicationBaseEntity {
  @Column({ type: 'int', default: 0 })
  requestedCount: number;

  @Column({ type: 'int', default: 0 })
  generatedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  @Column({ type: 'varchar', length: 16, default: 'SUCCESS' })
  status: 'SUCCESS' | 'FAILED';

  @Column({ type: 'text', nullable: true })
  message: string | null;
}

