import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SyncPlayersQueryDto {
  @ApiPropertyOptional({
    description: 'Season year (e.g. 2026)',
    default: 2026,
    minimum: 2000,
    maximum: 2100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  season?: number;

  @ApiPropertyOptional({
    description:
      'Comma-separated competitions/leagues. Example: 1,39,140 (api-football league IDs) or WC,PL,PD (football-data competition codes).',
    example: '1,39,140',
  })
  @IsOptional()
  @IsString()
  competitions?: string;
}

