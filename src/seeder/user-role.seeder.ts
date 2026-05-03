import { DataSource } from 'typeorm';

export async function seedUserRole(dataSource: DataSource): Promise<void> {
  console.log('seeding user-role');

  const SUPER_ADMIN_ROLE_ID = '367cda99-e893-406f-a5b1-0591ddfe4001';
  const ADMIN_ROLE_ID = '367cda99-e893-406f-a5b1-0591ddfe5001';
  const GUEST_ROLE_ID = '367cda99-e893-406f-a5b1-0591ddfe4009';

  await dataSource
    .createQueryBuilder()
    .insert()
    .into('user_roles_role')
    .values([
      {
        userId: '8d241a5c-ed6a-45b4-b781-3903eabfbb16',
        roleId: SUPER_ADMIN_ROLE_ID,
      },
      {
        userId: 'ebb268b1-22b3-4ab3-a646-8eff36588899',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '3270cef0-acff-46ab-b584-620fbdbe6215',
        roleId: ADMIN_ROLE_ID,
      },
      {
        userId: '235c1d9e-67cb-4c75-9da4-b6251de116d3',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '80e8d8a2-5978-4405-a9ef-6b5b10c2aff4',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '050bdb12-af6d-496b-a2bb-d6594849be3e',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '660f98f2-68a5-450d-b032-48914b4d995e',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: 'b0829747-b14d-458a-b213-ad3059e4b33d',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '1b0ebde3-41bb-4b29-9bb1-51e611e14e2e',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '1e4b752c-8072-445a-a760-90024838140a',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7a',
        roleId: GUEST_ROLE_ID,
      },
      {
        userId: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7b',
        roleId: GUEST_ROLE_ID,
      },
    ])
    .orIgnore()
    .execute();

  console.log('user-role seeded\n');

  return;
}
