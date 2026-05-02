import { BaseDto } from '@common/dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SmsStatusType } from '../enums/sms-status.enum';

export class FilterSmsDto extends BaseDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(SmsStatusType)
  status?: SmsStatusType;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}
