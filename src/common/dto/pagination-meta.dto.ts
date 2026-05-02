import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortByDto } from './sort-by.dto';

export class PaginationMetaDto {
  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty({ required: false })
  totalItems?: number;

  @ApiProperty({ required: false })
  currentPage?: number;

  @ApiProperty({ required: false })
  totalPages?: number;

  @ApiProperty({ type: [SortByDto] })
  sortBy?: SortByDto[];

  @ApiProperty({ required: false })
  search?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  filter?: Record<string, any>;
}
