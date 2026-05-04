import { AuthModule, Authv2Module } from '@app/auth/auth.module';
import { FileModule } from '@app/file/file.module';
import { NotificationModule } from '@app/notification/notification.module';
import { SmsTemplateModule } from '@app/sms-template/sms-template.module';
import { SmsModule } from '@app/sms/sms.module';
import { SmsTemplateParameterModule } from '@app/smsTemplateParameter/sms-template-parameter.module';
import { TemplateParameterModule } from '@app/templateParameter/template-parameter.module';
import { CardsModule } from '@app/cards/cards.module';
import { PlayersModule } from '@app/players/players.module';
import { ChestsModule } from '@app/chests/chests.module';
import { MarketModule } from '@app/market/market.module';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { MissionsModule } from '@app/missions/missions.module';
import { ElasticSearchModule } from '@common/modules/elastic-search/elastic-search.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ClansModule } from '@app/clans/clans.module';

export async function setUpSwagger(app: INestApplication) {
  const v1config = new DocumentBuilder()
    .setTitle('Havadari system api')
    .setVersion('1.0.0')
    .setDescription('Havadari API documentation')
    .setExternalDoc(
      'View the raw OpenAPI Specification in JSON format',
      '/v1/swagger.json',
    )
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const v2config = new DocumentBuilder()
    .setTitle('Havadari system api')
    .setVersion('2.0.0')
    .setDescription('Havadari API documentation v2')
    .setExternalDoc(
      'View the raw OpenAPI Specification in JSON format',
      '/v2/swagger.json',
    )
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const swaggerv1 = SwaggerModule.createDocument(app, v1config, {
    include: [
      AuthModule,
      FileModule,
      SmsModule,
      SmsTemplateModule,
      TemplateParameterModule,
      SmsTemplateParameterModule,
      ElasticSearchModule,
      PlayersModule,
      CardsModule,
      ChestsModule,
      MarketModule,
      LeaderboardModule,
      MissionsModule,
      ClansModule,
    ],
  });

  const swaggerv2 = SwaggerModule.createDocument(app, v2config, {
    include: [Authv2Module, NotificationModule],
  });

  Object.values((swaggerv1 as OpenAPIObject).paths).forEach((path: any) => {
    Object.values(path).forEach((method: any) => {
      if (
        Array.isArray(method.security) &&
        method.security.includes('isPublic')
      ) {
        method.security = [];
      }
    });
  });

  SwaggerModule.setup('v1/docs', app, swaggerv1, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Havadari API Docs',
    jsonDocumentUrl: '/v1/swagger.json',
  });

  SwaggerModule.setup('v2/docs', app, swaggerv2, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Havadari API Docs v2',
    jsonDocumentUrl: '/v2/swagger.json',
  });
}
