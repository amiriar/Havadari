import { IsEnum, IsString, IsUUID } from 'class-validator';
import { AccessLevels } from '../enums/access-levels.enum';
import { Exists } from '@common/validators/exists';
import { PermissionCategory } from '../entities/permission-category.entity';
import { ApiHideProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @IsEnum(AccessLevels)
  accessLevel: AccessLevels;

  @IsUUID()
  @Exists(PermissionCategory)
  categoryId: string;

  @IsString()
  title: string;

  @IsString()
  translatedTitle: string;

  @ApiHideProperty()
  name: string;

  @ApiHideProperty()
  categoryName: string;
}
