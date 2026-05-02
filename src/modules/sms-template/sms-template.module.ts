import { SmsTemplateParameterModule } from '@app/smsTemplateParameter/sms-template-parameter.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsTemplateEntity } from './entities/sms-template.entity';
import { SmsTemplateController } from './sms-template.controller';
import { SmsTemplateService } from './sms-template.service';
import { TemplateParameterModule } from '@app/templateParameter/template-parameter.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsTemplateEntity]),
    SmsTemplateParameterModule,
    TemplateParameterModule,
  ],
  controllers: [SmsTemplateController],
  providers: [SmsTemplateService],
  exports: [SmsTemplateService],
})
export class SmsTemplateModule {}
