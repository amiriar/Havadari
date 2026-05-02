import { IsFutureDate } from '@common/validators/is-future-date-constraint';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class SendSmsDto {
  @ValidateIf((o) => !o.text)
  @IsUUID()
  @IsNotEmpty({
    message:
      'If you didnt provide the message text, you must provide templateId.',
  })
  templateId?: string;

  @ValidateIf((o) => !!o.templateId)
  @IsUUID()
  @IsNotEmpty({ message: 'userId is required while using template' })
  @Transform(({ value, obj }) => {
    if (!obj.templateId) return undefined;
    return value;
  })
  userId?: string;

  @IsPhoneNumber('IR')
  @IsNotEmpty()
  phoneNumber: string;

  @ValidateIf((o) => !o.templateId)
  @IsString()
  @IsNotEmpty({
    message: 'If you didnt provide templateId, you must provide text.',
  })
  text?: string;

  @IsOptional()
  @IsDateString()
  @IsFutureDate()
  scheduleSms?: Date;
}
