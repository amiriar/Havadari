import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { User } from '@app/auth/entities/user.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { hasRole } from '@common/utils/has-role';
import { AUTHORIZATION_ERROR } from '@common/constants/websocket-events';

export abstract class RoleAuthorizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = this.getSocketClient(context);

    const user: User = client.data.user;

    const roles: ApplicationMainRoles =
      this.getAuthorizedRoles() as ApplicationMainRoles;

    if (hasRole(user, roles)) {
      return true;
    }

    client.emit(AUTHORIZATION_ERROR, { message: 'Forbbiden' });
    client.disconnect();

    return false;
  }

  abstract getAuthorizedRoles():
    | ApplicationMainRoles
    | Array<ApplicationMainRoles>;

  protected getSocketUser(context: ExecutionContext): User {
    const client: Socket = this.getSocketClient(context);
    return client.data.user;
  }

  protected getSocketClient(context: ExecutionContext): Socket {
    return context.switchToWs().getClient();
  }
}
