import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetPlayersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ enum: ['GK', 'DEF', 'MID', 'FW'] })
  @IsOptional()
  @IsIn(['GK', 'DEF', 'MID', 'FW'])
  position?: 'GK' | 'DEF' | 'MID' | 'FW';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competitionCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5000, default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
