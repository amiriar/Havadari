import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { SendSmsDto } from './send-sms.dto';

export class SendGroupSmsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendSmsDto)
  messages: SendSmsDto[];

  @IsOptional()
  isFlash?: boolean;
}
