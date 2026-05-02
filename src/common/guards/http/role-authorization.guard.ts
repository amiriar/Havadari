import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { hasRole } from '@common/utils/has-role';
import { User } from '@app/auth/entities/user.entity';

@Injectable()
export abstract class RoleAuthorizationGuard {
  abstract getAuthorizedRoles():
    | ApplicationMainRoles
    | Array<ApplicationMainRoles>;

  canActivate(context: ExecutionContext): boolean {
    const user: User = this.getUser(context);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (hasRole(user, ApplicationMainRoles.SUPERADMIN)) {
      return true;
    }

    const roles: ApplicationMainRoles =
      this.getAuthorizedRoles() as ApplicationMainRoles;

    if (hasRole(user, roles)) {
      return true;
    }

    return false;
  }

  protected getUser(context: ExecutionContext): User {
    const request: Request = context.switchToHttp().getRequest();
    return request['user'];
  }
}
