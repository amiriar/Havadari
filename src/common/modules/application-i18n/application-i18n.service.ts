import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';
@Injectable()
export class ApplicationI18nService {
  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  t(key: string, options?: TranslateOptions): string {
    const lang =
      I18nContext.current()?.lang ||
      this.configService.get<string>('I18N_FALLBACK_LANGUAGE') ||
      'fa';

    return this.i18n.translate(key, { lang, ...options }) as string;
  }
}
