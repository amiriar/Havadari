import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional } from 'class-validator';

export class AdminAdjustUserWalletDto {
  @ApiPropertyOptional({
    description: 'Delta FGC amount, can be negative.',
    example: 500,
  })
  @IsOptional()
  @IsInt()
  fgcDelta?: number;

  @ApiPropertyOptional({
    description: 'Delta gems amount, can be negative.',
    example: 50,
  })
  @IsOptional()
  @IsInt()
  gemsDelta?: number;
}

