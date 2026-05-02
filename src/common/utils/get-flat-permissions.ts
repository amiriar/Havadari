import { Permission } from '@app/auth/entities/permission.entity';
import { Role } from '@app/auth/entities/role.entity';
import { User } from '@app/auth/entities/user.entity';

export function getFlatPermissions(
  user: User,
  applicationRoles: Role[],
): Array<Permission> {
  const inDirectPermissions = [];

  let tempRole: Role;

  if (!applicationRoles) {
    return user.permissions;
  }

  for (const role of user.roles) {
    tempRole = applicationRoles.find((appRole) => {
      return appRole.id == role.id;
    });

    if (tempRole) {
      inDirectPermissions.push(...tempRole.permissions);
    }
  }

  return user.permissions.concat(inDirectPermissions);
}
