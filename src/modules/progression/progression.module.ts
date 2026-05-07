import { User } from '@app/auth/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgressionService } from './progression.service';
import { AdminProgressionController } from './admin-progression.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminProgressionController],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
