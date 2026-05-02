import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsTemplateParameterEntity } from './entities/sms-template-parameter.entity';
import { SmsTemplateParameterService } from './sms-template-parameter.service';

@Module({
  imports: [TypeOrmModule.forFeature([SmsTemplateParameterEntity])],
  providers: [SmsTemplateParameterService],
  exports: [SmsTemplateParameterService],
})
export class SmsTemplateParameterModule {}
