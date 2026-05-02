import {
  IsPhoneNumber,
  IsEmail,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
