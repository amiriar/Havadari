import { NotExists } from '@common/validators/not-exists-constraint';
import { ApiProperty } from '@nestjs/swagger';
import {
  Allow,
  IsEmail,
  IsNumberString,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { User } from '../entities/user.entity';

export class updateProfileDto {
  @ApiProperty({
    name: 'userName',
  })
  @IsOptional()
  @IsString()
  @NotExists(User)
  userName?: string;

  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsNumberString()
  @NotExists(User)
  nationalCode?: string;

  @IsOptional()
  @IsEmail()
  @NotExists(User)
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  @NotExists(User)
  phoneNumber?: string;

  @Allow()
  avater?;

  @Allow()
  fingerprint?;

  @Allow()
  signature?;
}
