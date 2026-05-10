import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminImportWorldcupMatchesDto {
  @ApiPropertyOptional({ default: 2026, minimum: 1930, maximum: 2100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1930)
  @Max(2100)
  year?: number = 2026;

  @ApiPropertyOptional({
    default: true,
    description: 'If true, imported matches are set to OPEN status.',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() !== 'false';
    return Boolean(value);
  })
  @IsBoolean()
  open?: boolean = true;
}

