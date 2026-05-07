import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CardEditionEnum,
  CardRarityEnum,
  PlayerPositionEnum,
} from '../constants/card.enums';

export class AdminCardQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 500, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: CardRarityEnum })
  @IsOptional()
  @IsEnum(CardRarityEnum)
  rarity?: CardRarityEnum;

  @ApiPropertyOptional({ enum: PlayerPositionEnum })
  @IsOptional()
  @IsEnum(PlayerPositionEnum)
  position?: PlayerPositionEnum;

  @ApiPropertyOptional({ enum: CardEditionEnum })
  @IsOptional()
  @IsEnum(CardEditionEnum)
  edition?: CardEditionEnum;
}

