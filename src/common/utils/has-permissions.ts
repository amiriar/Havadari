import { User } from '@app/auth/entities/user.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { hasRole } from './has-role';

export function hasPermission(user: User, permissionName: string): boolean {
  if (!user.roles || user.roles.length === 0) {
    return false;
  }

  // Superadmin has all permissions
  if (hasRole(user, ApplicationMainRoles.SUPERADMIN)) {
    return true;
  }

  // Check all roles for the permission
  for (const role of user.roles) {
    if (
      role.permissions &&
      role.permissions.some((p) => p.name === permissionName)
    ) {
      return true;
    }
  }

  return false;
}
