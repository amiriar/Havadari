import { FileModule } from '@app/file/file.module';
import { SmsTemplateModule } from '@app/sms-template/sms-template.module';
import { SmsTemplateParameterModule } from '@app/smsTemplateParameter/sms-template-parameter.module';
import { NotificationModule } from '@app/notification/notification.module';
import { ApplicationCacheInterceptor } from '@common/interceptos/application-cache.interceptor';
import { DefaultResponseInterceptor } from '@common/interceptos/default-response.interceptor';
import { DefaultExceptionFilter } from '@common/filters/default-exception.filter';
import { ApplicationI18nModule } from '@common/modules/application-i18n/application-i18n.module';
import { ApplicationCacheModule } from '@common/modules/cache/cache-module';
import { ApplicationConfigModule } from '@common/modules/config/application-config.module';
import { ElasticSearchModule } from '@common/modules/elastic-search/elastic-search.module';
import { RedisModule } from '@common/modules/redis/redis.module';
import { GetEventEmmiter } from '@common/services/get-event-emiter.service';
import { RequestContextService } from '@common/services/request-context.service';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationMiddleWare } from 'src/common/middlewares/authentication.middleware';
import { TypeormConfig } from 'src/config/typeorm.config';
import { AuthModule, Authv2Module } from '../auth/auth.module';
import { SmsModule } from '../sms/sms.module';
import { CardsModule } from '../cards/cards.module';
import { PlayersModule } from '../players/players.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ApplicationConfigModule,
    TypeOrmModule.forRootAsync({
      useClass: TypeormConfig,
    }),
    ScheduleModule.forRoot(),
    RedisModule.forRootAsync(),
    EventEmitterModule.forRoot(),
    ApplicationI18nModule,
    AuthModule,
    Authv2Module,
    FileModule,
    SmsModule,
    PlayersModule,
    CardsModule,
    SmsTemplateModule,
    SmsTemplateParameterModule,
    NotificationModule,
    ElasticSearchModule,
    ApplicationCacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApplicationCacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DefaultResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: DefaultExceptionFilter,
    },
    RequestContextService,
    GetEventEmmiter,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleWare)
      .exclude({
        path: 'auth/*splat',
        method: RequestMethod.ALL,
      })
      .forRoutes('*splat');
  }
}
