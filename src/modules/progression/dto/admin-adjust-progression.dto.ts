import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AdminAdjustProgressionDto {
  @ApiPropertyOptional({
    description: 'Add EXP amount (uses normal level-up logic).',
    example: 250,
  })
  @IsOptional()
  @IsInt()
  expDelta?: number;

  @ApiPropertyOptional({
    description: 'Add/Subtract trophies (cannot go below 0).',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  trophiesDelta?: number;

  @ApiPropertyOptional({
    description: 'Set absolute level directly.',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  setLevel?: number;

  @ApiPropertyOptional({
    description: 'Set absolute exp directly.',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  setExp?: number;
}

