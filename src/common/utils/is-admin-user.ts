import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

export function isAdminUser(roles: { name: string }[] = []): boolean {
  return roles.some(
    (role) =>
      role.name === ApplicationMainRoles.ADMIN ||
      role.name === ApplicationMainRoles.SUPERADMIN,
  );
}
