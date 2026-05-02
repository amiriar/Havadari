import { Permission } from '@app/auth/entities/permission.entity';
import { Role } from '@app/auth/entities/role.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { DataSource } from 'typeorm';
import { PermissionCategoryName } from './permisssion-categories.seeder';

type PermissionAction = 'read' | 'create' | 'update' | 'delete';
const crudPermission: PermissionAction[] = [
  'create',
  'read',
  'update',
  'delete',
];

type RolePermissionMap = {
  [role in ApplicationMainRoles]?: {
    [category in PermissionCategoryName]?: PermissionAction[];
  };
};

const rolePermissionMap: RolePermissionMap = {
  [ApplicationMainRoles.ADMIN]: {
    user: crudPermission,
    sms_template: crudPermission,
    course: crudPermission,
    comment: crudPermission,
    discount: crudPermission,
    survey: crudPermission,
  },
};

export const seedRolePermissions = async (dataSource: DataSource) => {
  const roleRepo = dataSource.getRepository(Role);
  const permissionRepo = dataSource.getRepository(Permission);

  const allPermissions = await permissionRepo.find();

  for (const [roleName, permissionNames] of Object.entries(rolePermissionMap)) {
    const role = await roleRepo.findOne({
      where: { name: roleName as ApplicationMainRoles },
      relations: ['permissions'],
    });

    const matchedPermissions = allPermissions.filter((p) =>
      Object.entries(permissionNames || {}).some(([category, actions]) =>
        actions?.some((action) => p.name === `${action}_${category}`),
      ),
    );
    role.permissions = matchedPermissions;

    await roleRepo.save(role);
  }
};
