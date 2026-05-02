import { IsEmail, IsString } from 'class-validator';

export class EmailVerificationDto {
  @IsEmail()
  email: string;

  @IsString()
  otp: string;
}
