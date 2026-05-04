import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Length } from 'class-validator';

export class RankedSeasonRewardDto {
  @ApiPropertyOptional({ example: '2026-05' })
  @IsOptional()
  @Length(4, 32)
  seasonKey?: string;
}
