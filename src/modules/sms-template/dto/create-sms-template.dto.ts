import { NotExists } from '@common/validators/not-exists-constraint';
import { IsArray, IsString, IsUUID } from 'class-validator';
import { SmsTemplateEntity } from '../entities/sms-template.entity';

export class CreateSmsTemplateDto {
  @IsString()
  @NotExists(SmsTemplateEntity)
  name: string;

  @IsString()
  text: string;

  @IsArray()
  @IsUUID('4', { each: true })
  parameterIds?: string[];
}
