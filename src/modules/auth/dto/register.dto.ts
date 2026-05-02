import { NotExists } from '@common/validators/not-exists-constraint';
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
import { CreateRoleDto } from './create-role.dto';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
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

  @ApiHideProperty()
  roles?: Array<CreateRoleDto>;

  @Allow()
  avater?;

  @Allow()
  fingerprint?;

  @Allow()
  signature?;
}
