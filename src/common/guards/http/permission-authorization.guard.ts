import { User } from '@app/auth/entities/user.entity';
import { AUTHORIZED_PERMISSIONS, TARGET_ENTITY } from '@common/constants/keys';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { getLasHour } from '@common/utils/date-utills/get-last-hour';
import { hasRole } from '@common/utils/has-role';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityTarget,
  MoreThanOrEqual,
  ObjectLiteral,
} from 'typeorm';
@Injectable()
export class PermissionsAuthorizationGuard implements CanActivate {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: User = this.getUser(context);

    if (!user) {
      throw new UnauthorizedException();
    }

    const requiredPermissions: string[] = this.reflectPermissions(context);

    // Superadmin has all permissions
    if (hasRole(user, ApplicationMainRoles.SUPERADMIN)) {
      return true;
    }

    const req = this.getRequest(context);

    const targetEntity = this.refelctEntity(context);

    if (targetEntity) {
      const isOwner: boolean = await this.dataSource.manager.exists(
        targetEntity,
        {
          where: {
            createdAt: MoreThanOrEqual(getLasHour()),
            id: req.params?.id,
            creatorId: user.id,
          },
        },
      );

      if (isOwner) {
        return true;
      }
    }

    return await this.hasPermission(user, requiredPermissions);
  }

  protected getUser(context: ExecutionContext): User {
    const request: Request = context.switchToHttp().getRequest();
    return request['user'];
  }

  protected getRequest(context: ExecutionContext) {
    return context.switchToHttp().getRequest();
  }

  private reflectPermissions(context: ExecutionContext): string[] {
    return this.reflector.get<string[]>(
      AUTHORIZED_PERMISSIONS,
      context.getHandler(),
    );
  }

  private refelctEntity(context: ExecutionContext) {
    return this.reflector.get<EntityTarget<ObjectLiteral>>(
      TARGET_ENTITY,
      context.getHandler(),
    );
  }

  private async hasPermission(
    user: User,
    permissions: string[],
  ): Promise<boolean> {
    const permissionsSet: Set<string> = new Set(user.permissionsSet);
    for (const permission of permissions) {
      if (!permissionsSet.has(permission)) {
        return false;
      }
    }

    return true;
  }
}
