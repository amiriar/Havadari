import { IsString } from 'class-validator';

export class SendQuickSmsDto {
  @IsString()
  phoneNumber: string;

  @IsString()
  text: string;
}
