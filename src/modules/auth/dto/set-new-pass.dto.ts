import { IsPhoneNumber, IsString, IsNotEmpty } from 'class-validator';

export class SetNewPassDto {
  @IsPhoneNumber()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsString()
  @IsNotEmpty()
  new_pass: string;
}
