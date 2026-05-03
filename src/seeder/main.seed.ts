import { seedRoles } from './roles.seeder';
import { seedPermissions } from './permisssions.seeder';
import { seedUsers } from './users.seeder';
import { exit } from 'process';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { seedTemplateParameters } from './template-parameter.seeder';
import { seedPermissionCategories } from './permisssion-categories.seeder';
import { seedRolePermissions } from './role-permission-seeder';
import { seedUserRole } from './user-role.seeder';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app/app.module';
import { ApplicationI18nService } from '@common/modules/application-i18n/application-i18n.service';
import { seedLeaderboardRewards } from './leaderboard-rewards.seeder';

import { seedFiles } from './files.seeder';

dotenv.config();
let dataSource: DataSource;

async function setDataSource() {
  if (dataSource) {
    return dataSource;
  }

  dataSource = new DataSource({
    type: (process.env.DB_TYPE || 'postgres') as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dropSchema: false,
    logging: false,
    logger: 'file',
    entities: ['src/**/*.entity.ts'],
    migrations: ['src/migrations/**/*.ts'],
    subscribers: ['src/subscriber/**/*.ts'],
  });

  return dataSource;
}

async function runSeeder() {
  const app: INestApplication =
    await NestFactory.create<INestApplication>(AppModule);

  const i18nService: ApplicationI18nService = app.get(ApplicationI18nService);

  await setDataSource();
  await dataSource.initialize();
  await seedPermissionCategories(dataSource, i18nService);
  await seedPermissions(dataSource, i18nService);
  await seedRoles(dataSource);
  await seedRolePermissions(dataSource);
  await seedUsers(dataSource);
  await seedUserRole(dataSource);
  await seedTemplateParameters(dataSource);
  await seedLeaderboardRewards(dataSource);
  await seedFiles(dataSource);
  exit();
}
runSeeder();
