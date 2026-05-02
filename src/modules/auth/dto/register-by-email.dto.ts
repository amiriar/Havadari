import { IsEmail } from 'class-validator';
import { RegisterDto } from './register.dto';

export class RegisterByEmailDto extends RegisterDto {
  @IsEmail()
  email: string;
}
