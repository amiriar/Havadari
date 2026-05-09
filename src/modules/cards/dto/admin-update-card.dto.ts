import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CardEditionEnum,
  CardRarityEnum,
  PlayerPositionEnum,
} from '../constants/card.enums';

export class AdminUpdateCardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  playerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  teamName?: string | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  marketValue?: number | null;

  @ApiPropertyOptional({ enum: PlayerPositionEnum })
  @IsOptional()
  @IsEnum(PlayerPositionEnum)
  position?: PlayerPositionEnum;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  overallRating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  speed?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  power?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  skill?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  attack?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 99 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  defend?: number;

  @ApiPropertyOptional({ enum: CardRarityEnum })
  @IsOptional()
  @IsEnum(CardRarityEnum)
  rarity?: CardRarityEnum;

  @ApiPropertyOptional({ enum: CardEditionEnum })
  @IsOptional()
  @IsEnum(CardEditionEnum)
  edition?: CardEditionEnum;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  baseValue?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyPerformanceScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ratingVersion?: string;
}
