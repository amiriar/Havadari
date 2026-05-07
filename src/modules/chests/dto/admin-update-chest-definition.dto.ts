import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminUpdateChestDefinitionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costFgc?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  costGems?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 604800 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(604800)
  cooldownSeconds?: number;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Drops list with probability rows.',
  })
  @IsOptional()
  @IsArray()
  drops?: Array<Record<string, unknown>>;
}

