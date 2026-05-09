import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  CardEditionEnum,
  CardRarityEnum,
  PlayerPositionEnum,
  PlayerProviderEnum,
} from '../constants/card.enums';

export class AdminCreateCardDto {
  @ApiPropertyOptional({ enum: PlayerProviderEnum, nullable: true })
  @IsOptional()
  @IsEnum(PlayerProviderEnum)
  sourceProvider?: PlayerProviderEnum | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  sourceProviderPlayerId?: string | null;

  @ApiProperty()
  @IsString()
  playerName: string;

  @ApiProperty()
  @IsString()
  nationality: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  teamName?: string | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  marketValue?: number | null;

  @ApiProperty({ enum: PlayerPositionEnum })
  @IsEnum(PlayerPositionEnum)
  position: PlayerPositionEnum;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  overallRating: number;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  speed: number;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  power: number;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  skill: number;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  attack: number;

  @ApiProperty({ minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  defend: number;

  @ApiProperty({ enum: CardRarityEnum })
  @IsEnum(CardRarityEnum)
  rarity: CardRarityEnum;

  @ApiProperty({ enum: CardEditionEnum, default: CardEditionEnum.BASE })
  @IsEnum(CardEditionEnum)
  edition: CardEditionEnum;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  baseValue: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyPerformanceScore?: number;

  @ApiPropertyOptional({ default: 'v1' })
  @IsOptional()
  @IsString()
  ratingVersion?: string;
}
