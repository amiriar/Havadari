import { Exists } from '@common/validators/exists';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from 'class-validator';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
export class GrantPermissionToRoleDto {
  @IsUUID()
  @Exists(Role)
  roleId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @Exists(Permission, { each: true })
  permissionIds: string[];
}
