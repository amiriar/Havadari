import { User } from '@app/auth/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressionService } from './progression.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
