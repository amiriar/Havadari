import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@app/auth/entities/user.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { hasRole } from '@common/utils/has-role';
import { Reflector } from '@nestjs/core';
import { AUTHORIZED_ROLES } from '@common/constants/keys';

@Injectable()
export class RolesAuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const user: User = this.getUser(context);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (hasRole(user, ApplicationMainRoles.SUPERADMIN)) {
      return true;
    }

    const roles: ApplicationMainRoles[] = this.reflectRoles(context);

    const usersAuthorizedRoles = roles.filter((role) => hasRole(user, role));

    if (usersAuthorizedRoles.length === 0) {
      return false;
    }

    return true;
  }

  protected getUser(context: ExecutionContext): User {
    const request: Request = context.switchToHttp().getRequest();
    return request['user'];
  }

  private reflectRoles(context: ExecutionContext): ApplicationMainRoles[] {
    return this.reflector.get<ApplicationMainRoles[]>(
      AUTHORIZED_ROLES,
      context.getHandler(),
    );
  }
}
