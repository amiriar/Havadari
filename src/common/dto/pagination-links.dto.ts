import { ApiProperty } from '@nestjs/swagger';

export class PaginationLinksDto {
  @ApiProperty({ required: false })
  first?: string;

  @ApiProperty({ required: false })
  previous?: string;

  @ApiProperty()
  current: string;

  @ApiProperty({ required: false })
  next?: string;

  @ApiProperty({ required: false })
  last?: string;
}
