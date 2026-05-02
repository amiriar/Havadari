import { DataSource } from 'typeorm';

export async function seedUserRole(dataSource: DataSource): Promise<void> {
  console.log('seeding user-role');

  await dataSource
    .createQueryBuilder()
    .insert()
    .into('user_roles_role')
    .values([
      {
        userId: '8d241a5c-ed6a-45b4-b781-3903eabfbb16',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4001',
      },
      {
        userId: 'ebb268b1-22b3-4ab3-a646-8eff36588899',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4002',
      },
      {
        userId: '3270cef0-acff-46ab-b584-620fbdbe6215',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe5001',
      },
      {
        userId: '235c1d9e-67cb-4c75-9da4-b6251de116d3',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4003',
      },
      {
        userId: '80e8d8a2-5978-4405-a9ef-6b5b10c2aff4',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4004',
      },
      {
        userId: '050bdb12-af6d-496b-a2bb-d6594849be3e',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4005',
      },
      {
        userId: '660f98f2-68a5-450d-b032-48914b4d995e',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4006',
      },
      {
        userId: 'b0829747-b14d-458a-b213-ad3059e4b33d',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4007',
      },
      {
        userId: '1b0ebde3-41bb-4b29-9bb1-51e611e14e2e',
        roleId: '367cda99-e893-406f-a5b1-0591ddfe4008',
      },
      {
        userId: '1e4b752c-8072-445a-a760-90024838140a',
        roleId: 'f3d03537-1df0-46d9-b1e5-7c464fec1def',
      },
      {
        userId: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7a',
        roleId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
      {
        userId: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7b',
        roleId: 'a2ddb07e-cacf-4ddf-8dc7-f0668f03577c',
      },
    ])
    .orIgnore()
    .execute();

  console.log('user-role seeded\n');

  return;
}
