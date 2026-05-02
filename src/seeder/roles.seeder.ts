import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Role } from '@app/auth/entities/role.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';

//add other roles here
const roles: Array<DeepPartial<Role>> = [
  {
    id: '367cda99-e893-406f-a5b1-0591ddfe4001',
    name: ApplicationMainRoles.SUPERADMIN,
    title: 'the root user of the system has all of permissions by default',
    guardName: 'api',
  },
  {
    id: '367cda99-e893-406f-a5b1-0591ddfe5001',
    name: ApplicationMainRoles.ADMIN,
    title: 'the administrator of the system has all administration permissions',
    guardName: 'api',
  },
  {
    id: '367cda99-e893-406f-a5b1-0591ddfe4009',
    name: ApplicationMainRoles.GUEST,
    title: 'guest',
  },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  console.log('seeding roles');

  const repository: Repository<Role> = dataSource.getRepository(Role);

  await repository.upsert(roles, { conflictPaths: { id: true } });

  console.log('Roles seeded\n');

  return;
}
