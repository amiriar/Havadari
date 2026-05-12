import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminReviewCardsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({
    minimum: 1,
    default: 50000000,
    description: 'Only cards with marketValue >= this number are returned.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minMarketValue?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Return only cards already flagged as image mismatch.',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  flaggedOnly?: boolean;
}
