import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';

const dbConnectionString = process.env.DB_CONNECTION_STRING;
const migrations = __filename.endsWith('.ts')
  ? ['src/migrations/**/*.ts']
  : ['dist/migrations/**/*.js'];

const dataSourceOptions = {
  type: 'postgres',
  ...(dbConnectionString
    ? {
        url: dbConnectionString,
      }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }),
  dropSchema: false,
  logging: false,
  logger: 'file',
  entities: ['dist/**/*.entity.js'],
  migrations,
  subscribers: ['src/subscriber/**/*.ts'],
} as any;

export default new DataSource(dataSourceOptions);
