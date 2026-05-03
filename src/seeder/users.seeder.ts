import { DataSource, DeepPartial, Repository } from 'typeorm';
import { User } from '@app/auth/entities/user.entity';
import { genSaltSync, hashSync } from 'bcrypt';
import { config } from 'dotenv';

config();
const salt = genSaltSync();
const hPassword = hashSync(process.env.SUPER_ADMIN_PASSWORD, salt);

const users: Array<DeepPartial<User>> = [
  {
    id: '8d241a5c-ed6a-45b4-b781-3903eabfbb16',
    userName: 'super_admin',
    password: hPassword,
    email: 'superadmin@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 1200,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4001',
      },
    ],
  },
  {
    id: 'ebb268b1-22b3-4ab3-a646-8eff36588899',
    userName: 'sample_doctor',
    password: hPassword,
    email: 'doctor@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 600,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4002',
      },
    ],
  },
  {
    id: '3270cef0-acff-46ab-b584-620fbdbe6215',
    userName: 'sample_admin',
    password: hPassword,
    email: 'admin@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 800,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe5001',
      },
    ],
  },
  {
    id: '235c1d9e-67cb-4c75-9da4-b6251de116d3',
    userName: 'sample_secretary',
    password: hPassword,
    email: 'secretary@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 400,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4003',
      },
    ],
  },
  {
    id: '80e8d8a2-5978-4405-a9ef-6b5b10c2aff4',
    userName: 'sample_warehouse_manager',
    password: hPassword,
    email: 'warehouse_manager@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 400,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4004',
      },
    ],
  },
  {
    id: '050bdb12-af6d-496b-a2bb-d6594849be3e',
    userName: 'sample_patient',
    password: hPassword,
    email: 'patient@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 300,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4005',
      },
    ],
  },
  {
    id: '660f98f2-68a5-450d-b032-48914b4d995e',
    userName: 'sample_receptionist',
    password: hPassword,
    email: 'receptionist@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 350,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4006',
      },
    ],
  },
  {
    id: 'b0829747-b14d-458a-b213-ad3059e4b33d',
    userName: 'sample_assistant',
    password: hPassword,
    email: 'assistant@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 350,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4007',
      },
    ],
  },
  {
    id: '1b0ebde3-41bb-4b29-9bb1-51e611e14e2e',
    userName: 'sample_supervisor',
    password: hPassword,
    email: 'supervisor@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 500,
    roles: [
      {
        id: '367cda99-e893-406f-a5b1-0591ddfe4008',
      },
    ],
  },
  {
    id: '1e4b752c-8072-445a-a760-90024838140a',
    userName: 'sample_scan_operator',
    password: hPassword,
    email: 'scan_operator@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 450,
    roles: [
      {
        id: 'f3d03537-1df0-46d9-b1e5-7c464fec1def',
      },
    ],
  },
  {
    id: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7a',
    userName: 'sample_lab_order_manager',
    password: hPassword,
    email: 'lab_order_manager@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 450,
    roles: [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
    ],
  },
  {
    id: '3e7d9f2a-1b4c-4d5e-8f9a-2b3c4d5e6f7b',
    userName: 'sample_bank_represent',
    password: hPassword,
    email: 'bank_represent@email.com',
    isEmailVerified: true,
    isPhoneVerified: true,
    rankPoints: 450,
    roles: [
      {
        id: 'a2ddb07e-cacf-4ddf-8dc7-f0668f03577c',
      },
    ],
  },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('seeding users');

  const repository: Repository<User> = dataSource.getRepository(User);

  await repository.upsert(users, {
    // Must match an actual UNIQUE constraint/index in DB.
    // `userName` is unique; `(userName,id)` is not a composite unique index.
    conflictPaths: ['userName'],
  });

  console.log('Users seeded\n');

  return;
}
