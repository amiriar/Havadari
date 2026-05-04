import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  CardRarityEnum,
  PlayerPositionEnum,
} from '@app/cards/constants/card.enums';
import { ListingTypeEnum } from '../constants/market.types';

export class GetMarketListingsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ enum: CardRarityEnum })
  @IsOptional()
  @IsEnum(CardRarityEnum)
  rarity?: CardRarityEnum;

  @ApiPropertyOptional({ enum: PlayerPositionEnum })
  @IsOptional()
  @IsEnum(PlayerPositionEnum)
  position?: PlayerPositionEnum;

  @ApiPropertyOptional({ enum: ListingTypeEnum })
  @IsOptional()
  @IsEnum(ListingTypeEnum)
  type?: ListingTypeEnum;
}
