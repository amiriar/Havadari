import { CreatorIdSubscriber } from '@common/subscribers/set-creatorid.subscriber';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class TypeormConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    const migrations = __filename.endsWith('.ts')
      ? ['src/migrations/**/*.ts']
      : ['dist/migrations/**/*.js'];
    const dbConnectionString =
      this.configService.get<string>('DB_CONNECTION_STRING');

    return {
      type: 'postgres',
      ...(dbConnectionString
        ? {
            url: dbConnectionString,
          }
        : {
            host: this.configService.get<string>('DB_HOST'),
            port: this.configService.get<number>('DB_PORT'),
            username: this.configService.get<string>('DB_USERNAME'),
            password: this.configService.get<string>('DB_PASSWORD'),
            database: this.configService.get<string>('DB_NAME'),
          }),
      entities: [
        'dist/**/**/**/*.entity{.ts,.js}',
        'dist/**/**/*.entity{.ts,.js}',
      ],
      logging: ['schema', 'error'],

      migrations,
      synchronize: process.env.NODE_ENV === 'development' ? true : false,
      subscribers: [CreatorIdSubscriber],
    };
  }
}
