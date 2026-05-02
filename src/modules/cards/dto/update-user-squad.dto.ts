import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class UpdateUserSquadDto {
  @ApiProperty({ type: [String], minItems: 5, maxItems: 5 })
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  userCardIds: string[];

  @ApiPropertyOptional({
    default: true,
    description:
      'When true, enforce GK/DEF/MID/FW/FW composition. When false, only ownership/listing rules apply.',
  })
  @IsOptional()
  @IsBoolean()
  enforcePositions?: boolean;
}
