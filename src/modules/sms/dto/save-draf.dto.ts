import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { SendSmsDto } from './send-sms.dto';

export class SaveDraftDto implements Omit<SendSmsDto, 'scheduleSms'> {
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
}
