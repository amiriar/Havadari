import { AUTHORIZED_ROLES } from '@common/constants/keys';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { SetMetadata } from '@nestjs/common';

export const SetAuthorizedRoles = (roles: Array<ApplicationMainRoles>) => {
  return SetMetadata(AUTHORIZED_ROLES, roles);
};
