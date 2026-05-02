import { ApiProperty } from '@nestjs/swagger';
import { PaginationLinksDto } from './pagination-links.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedResponse {
  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiProperty({ type: PaginationLinksDto })
  links: PaginationLinksDto;
}
