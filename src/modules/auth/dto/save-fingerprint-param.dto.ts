import { Exists } from '@common/validators/exists';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { User } from '../entities/user.entity';

export class SaveFingerprintParamDto {
  @IsUUID()
  @IsNotEmpty()
  @Exists(User)
  userId: string;
}
