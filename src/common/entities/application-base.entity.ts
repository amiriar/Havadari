import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class ApplicationBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @CreateDateColumn({ type: 'timestamp', select: true })
  createdAt: Date;

  @Index()
  @UpdateDateColumn({ type: 'timestamp', select: true })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', select: true })
  deletedAt: Date;

  @Column('uuid', { nullable: true })
  creatorId: string;
}
