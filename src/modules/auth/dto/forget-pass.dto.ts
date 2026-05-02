import { IsPhoneNumber } from 'class-validator';

export class ForgetPassDto {
  @IsPhoneNumber()
  phone: string;
}
