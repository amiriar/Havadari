import { IsPhoneNumber, IsString } from 'class-validator';

export class PhoneVerificationDto {
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  otp: string;
}
