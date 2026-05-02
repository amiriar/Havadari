import { User } from '@app/auth/entities/user.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

export function hasRole(user: User, roleName: ApplicationMainRoles): boolean {
  return !!user?.roles?.find((role) => role.name === roleName);
}
