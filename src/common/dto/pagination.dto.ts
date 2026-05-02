import { ApiHideProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, NotEquals } from 'class-validator';
export class PaginationDto {
  @IsOptional()
  @NotEquals('0')
  @IsNumberString({ no_symbols: true })
  page?: number;

  @IsOptional()
  @NotEquals('0')
  @IsNumberString({ no_symbols: true })
  limit?: number;

  @ApiHideProperty()
  path?: string;

  @ApiHideProperty()
  @IsOptional()
  noCache?: boolean;

  @ApiHideProperty()
  @IsOptional()
  nocache?: boolean;
}
