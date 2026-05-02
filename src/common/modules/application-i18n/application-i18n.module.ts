import { Global, Module } from '@nestjs/common';
import { ApplicationI18nService } from './application-i18n.service';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';

const resolveI18nPath = (): string => {
  const distPath = join(process.cwd(), 'dist', 'i18n');
  if (existsSync(distPath)) {
    return distPath;
  }

  return join(process.cwd(), 'src', 'i18n');
};
@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get<string>(
          'I18N_FALLBACK_LANGUAGE',
          'en',
        ),
        loaderOptions: {
          path: resolveI18nPath(),
          watch: true,
        },
      }),
      resolvers: [
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
        { use: QueryResolver, options: ['lang'] },
      ],
      inject: [ConfigService],
    }),
  ],
  providers: [ApplicationI18nService],
  exports: [ApplicationI18nService],
})
export class ApplicationI18nModule {}
