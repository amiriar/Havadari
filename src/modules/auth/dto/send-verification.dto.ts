import { IsPhoneNumber } from 'class-validator';

export class sendVerificationCodeDto {
  @IsPhoneNumber()
  phoneNumber: string;
}
