import { SortType } from '@common/enums/sort-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class SortByDto {
  @ApiProperty({ example: 'createdAt' })
  field: string;

  @ApiProperty({ example: 'DESC', enum: SortType })
  @IsEnum(SortType)
  direction: SortType;
}
