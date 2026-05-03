import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PlayerPositionEnum } from '../constants/player.enums';

export class GetPlayersQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ enum: PlayerPositionEnum })
  @IsOptional()
  @IsEnum(PlayerPositionEnum)
  position?: PlayerPositionEnum;

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
