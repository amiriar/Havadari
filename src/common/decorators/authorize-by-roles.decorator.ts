import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { RolesAuthorizationGuard } from '@common/guards/http/roles-authoriaztion.guard';
import { applyDecorators, UseGuards } from '@nestjs/common';
import { SetAuthorizedRoles } from './set-authorized-roles-decorator';

export const AuthorizeByRoles = (roles: ApplicationMainRoles[]) => {
  return applyDecorators(
    SetAuthorizedRoles(roles),
    UseGuards(RolesAuthorizationGuard),
  );
};
