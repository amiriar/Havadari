import { Injectable, ExecutionContext } from '@nestjs/common';
import { RoleAuthorizationGuard } from './role-authoriaztion.guard';
import { User } from '@app/auth/entities/user.entity';
import { Socket } from 'socket.io';
import { hasRole } from '@common/utils/has-role';
import { AUTHORIZATION_ERROR } from '@common/constants/websocket-events';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

@Injectable()
export class RolesAuthorizationGuard extends RoleAuthorizationGuard {
  private roleNames: Array<ApplicationMainRoles>;

  constructor(roleNames: Array<ApplicationMainRoles>) {
    super();
    this.roleNames = roleNames;
  }

  /**
   * @override
   */
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = this.getSocketClient(context);

    const user: User = client.data.user;

    const roles: Array<ApplicationMainRoles> =
      this.getAuthorizedRoles() as Array<ApplicationMainRoles>;

    const usersAuthorizedRoles = roles.filter((roleName) =>
      hasRole(user, roleName),
    );

    if (usersAuthorizedRoles.length === 0) {
      client.emit(AUTHORIZATION_ERROR, { message: 'Forbbiden' });
      client.disconnect();

      return false;
    }

    return true;
  }

  /**
   * @override
   */
  getAuthorizedRoles(): ApplicationMainRoles | Array<ApplicationMainRoles> {
    return this.roleNames;
  }
}
