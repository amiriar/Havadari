import { Permission } from '@app/auth/entities/permission.entity';
import { AccessLevels } from '@app/auth/enums/access-levels.enum';
import { DataSource } from 'typeorm';
import {
  categories,
  PermissionCategoryName,
} from './permisssion-categories.seeder';
import { ApplicationI18nService } from '@common/modules/application-i18n/application-i18n.service';

const ACTIONS: AccessLevels[] = [
  AccessLevels.Create,
  AccessLevels.Read,
  AccessLevels.Delete,
  AccessLevels.Update,
] as const;

type PermissionName = `${AccessLevels}_${PermissionCategoryName}`;
export async function seedPermissions(
  dataSource: DataSource,
  i18n: ApplicationI18nService,
): Promise<void> {
  const permissionRepo = dataSource.getRepository(Permission);
  const permissionsToInsert: Permission[] = [];
  for (const category of categories) {
    for (const action of ACTIONS) {
      const name: PermissionName = `${action}_${category.name}`;
      const title: string = `permission to ${action} ${category.name}`;
      const translatedTitle: string =
        i18n.t(`access-level.${action}`) +
        ' ' +
        i18n.t(`permission-category.${category.name}`);
      const exists = await permissionRepo.findOne({ where: { name } });

      if (!exists) {
        const newPermission = permissionRepo.create({
          name,
          title,
          guardName: 'api',
          categoryName: category.name,
          categoryId: category.id,
          translatedTitle: translatedTitle,
        });
        permissionsToInsert.push(newPermission);
      }
    }
  }

  if (permissionsToInsert.length > 0) {
    await permissionRepo.save(permissionsToInsert);
    console.log(`Seeded ${permissionsToInsert.length} permissions.`);
  } else {
    console.log('No new permissions to seed.');
  }
}
