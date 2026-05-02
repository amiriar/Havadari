import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateParameterEntity } from './entities/template-parameter.entity';
import { TemplateParameterController } from './template-parameter.controller';
import { TemplateParameterService } from './template-parameter.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TemplateParameterEntity])],
  controllers: [TemplateParameterController],
  providers: [TemplateParameterService],
  exports: [TemplateParameterService],
})
export class TemplateParameterModule {}
