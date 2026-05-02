import { PaginationDto } from '@common/dto';
import { ApiHideProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsOptional,
  IsString,
} from 'class-validator';

export class FindUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsBooleanString()
  advancedSearch?: boolean;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nationalCode?: string;

  @ApiHideProperty()
  searchQuery?: Array<any>;
}
