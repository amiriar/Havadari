import { NotExists } from '@common/validators/not-exists-constraint';
import { IsPhoneNumber } from 'class-validator';
import { User } from '../entities/user.entity';

export class RegisterByPhoneDto {
  @IsPhoneNumber()
  @NotExists(User)
  phoneNumber: string;
}
