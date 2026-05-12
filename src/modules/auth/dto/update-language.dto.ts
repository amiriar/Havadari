import { UserLanguage } from '@common/enums/user-language.enum';
import { IsEnum } from 'class-validator';

export class UpdateLanguageDto {
  @IsEnum(UserLanguage)
  language: UserLanguage;
}

