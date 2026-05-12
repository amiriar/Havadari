import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminFlagCardImageDto {
  @ApiProperty({
    description: 'Set true if image does not match the player.',
  })
  @IsBoolean()
  flagged: boolean;

  @ApiPropertyOptional({
    description: 'Optional note about mismatch reason or what to fix.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
