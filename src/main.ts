import { AppModule } from '@app/app/app.module';
//import { Appv2Module } from '@app/app/appv2.module';
import { AuthService } from '@app/auth/services/auth.service';
import { RoleService } from '@app/auth/services/role.service';
import { ApplicationIoAdapter } from '@common/adapters/application-io-adapter';
import { CACHED_ROLES, ONE_HOUR_IN_MS } from '@common/utils/constants.utils';
import { exceptionFactory } from '@common/utils/exception-factory';
import { setUpSwagger } from '@common/utils/setup-swagger';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Cache } from 'cache-manager';
import dataSource from './config/data-source';

async function bootstrap() {
  const app: INestApplication =
    await NestFactory.create<INestApplication>(AppModule);

  //const appv2 = await NestFactory.create(Appv2Module);

  app.setGlobalPrefix('api');

  //appv2.setGlobalPrefix('api');

  app.enableVersioning();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: exceptionFactory,
    }),
  );

  app.enableCors();

  await dataSource.initialize();

  const configService: ConfigService = app.get(ConfigService);

  const wsAdepter: ApplicationIoAdapter = new ApplicationIoAdapter(
    app,
    configService,
    app.get(AuthService),
  );

  const rolesService: RoleService = app.get(RoleService);
  const redisEnabled =
    configService.get<string>('REDIS_ENABLED', 'false') === 'true';

  if (redisEnabled) {
    await wsAdepter.connectToRedis();
  }

  setUpSwagger(app);

  const port: number = Number(
    configService.get<string>('PORT') ??
      configService.get<string>('APP_PORT') ??
      3000,
  );

  app.useWebSocketAdapter(wsAdepter);

  const cacheManager: Cache = await app.get(CACHE_MANAGER);

  await cacheManager.clear();

  const roles = await rolesService.findAll();

  await cacheManager.set(CACHED_ROLES, roles, ONE_HOUR_IN_MS);

  await app.listen(port);

  ['v1', 'v2'].forEach((version) => {
    Logger.log(
      `SWAGGER ${version} URL: ` +
        configService.get<string>('ORIGIN') +
        `/${version}/docs`,
      'NestApplication',
    );
  });
}

bootstrap();
