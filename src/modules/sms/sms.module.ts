import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsEntity } from './entities/sms.entity';
import { SmsTemplateModule } from '@app/sms-template/sms-template.module';
import { AuthModule } from '@app/auth/auth.module';
import { SmsRepository } from './repository/sms.repository';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SmsEntity]),
    SmsTemplateModule,
    AuthModule,
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsRepository],
  exports: [SmsService],
})
export class SmsModule {}
