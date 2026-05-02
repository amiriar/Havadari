import { PermissionCategory } from '@app/auth/entities/permission-category.entity';
import { ApplicationI18nService } from '@common/modules/application-i18n/application-i18n.service';
import { DataSource, DeepPartial, Repository } from 'typeorm';

//add permissions to your newly created modules here
export const categories = [
  {
    id: '7c0c3120-2b9e-4ab4-aa1f-fce613df30c6',
    name: 'user',
  },
  {
    id: '53c72159-7e82-4bf7-8c83-5cc0bc1060f2',
    name: 'sms',
  },
  {
    id: '612ec301-b54e-4eb0-b371-e79e01694b82',
    name: 'sms_template',
  },
  {
    id: 'd8db6f14-a757-4dc2-9ca3-52a9bab8394d',
    name: 'permission',
  },
  {
    id: '567e04b8-d336-4dcf-b7c7-9557a76d17ca',
    name: 'permission_category',
  },
  {
    id: 'fb22e60a-caf7-4830-8465-fc9d032555c5',
    name: 'role',
  },
  {
    id: 'dbe34600-7c60-4365-8be8-272daf614eed',
    name: 'course',
  },
  {
    id: '7e8c525f-c87e-42dc-a716-57c1d6f3b2f1',
    name: 'comment',
  },
  {
    id: '89a04ffa-7a58-4da9-98d1-d89c5c3ad6a4',
    name: 'discount',
  },
  {
    id: '98325899-2d2f-4fe4-a70e-6f25af8fe9a8',
    name: 'survey',
  },
] as const;

export type PermissionCategoryName = (typeof categories)[number]['name'];

export async function seedPermissionCategories(
  dataSource: DataSource,
  i18n: ApplicationI18nService,
): Promise<void> {
  console.log('seeding permission categories');

  const repository: Repository<PermissionCategory> =
    dataSource.getRepository(PermissionCategory);

  const categoriesToSave: Array<DeepPartial<PermissionCategory>> =
    categories.map((c) => ({
      ...c,
      translatedTitle: i18n.t(`permission-category.${c.name}`),
      title: c.name,
    }));

  await repository.upsert(categoriesToSave, { conflictPaths: { name: true } });

  console.log('permission categories seeded\n');

  return;
}
