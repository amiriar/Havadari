import { Injectable } from '@nestjs/common';
import { RoleAuthorizationGuard } from './role-authorization.guard';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

@Injectable()
export class AdminAuthorizationGuard extends RoleAuthorizationGuard {
  /**
   * @override
   */
  getAuthorizedRoles(): ApplicationMainRoles {
    return ApplicationMainRoles.ADMIN;
  }
}
