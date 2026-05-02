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
import { ElasticSearchModule } from '@common/modules/elastic-search/elastic-search.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export async function setUpSwagger(app: INestApplication) {
  const v1config = new DocumentBuilder()
    .setTitle('spoticode reservation system api')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();

  const v2config = new DocumentBuilder()
    .setTitle('spoticode reservation system api')
    .setVersion('2.0.0')
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
  });

  SwaggerModule.setup('v2/docs', app, swaggerv2, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
