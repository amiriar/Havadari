import { applyDecorators, UseGuards } from '@nestjs/common';
import { EntityTarget, ObjectLiteral } from 'typeorm';
import { SetAuthorizedPermissions } from './set-authorized-permissions.decorator';
import { SetTargetEntity } from './set-target.entity';
import { PermissionsAuthorizationGuard } from '@common/guards/http/permission-authorization.guard';

export const AuthorizeByPermissions = (
  permissions: string[],
  targetEntity?: EntityTarget<ObjectLiteral>,
) => {
  return applyDecorators(
    SetAuthorizedPermissions(permissions),
    SetTargetEntity(targetEntity),
    UseGuards(PermissionsAuthorizationGuard),
  );
};
