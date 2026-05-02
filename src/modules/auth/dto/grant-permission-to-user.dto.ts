import { Exists } from '@common/validators/exists';
import { IsUUID, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { Permission } from '../entities/permission.entity';
import { User } from '../entities/user.entity';

export class GrantPermissionToUserDto {
  @IsUUID()
  @Exists(User)
  userId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @Exists(Permission, { each: true })
  permissionIds: string[];
}
