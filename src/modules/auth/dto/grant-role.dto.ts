import { Exists } from '@common/validators/exists';
import { IsUUID } from 'class-validator';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

export class GrantToUserDto {
  @IsUUID()
  @Exists(User)
  userId: string;

  @IsUUID()
  @Exists(Role)
  roleId: string;
}
