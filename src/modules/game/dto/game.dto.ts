import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSquadDto {
  @IsArray()
  @IsString({ each: true })
  cardIds: string[];
}

export class FindMarketListingsDto {
  @IsOptional()
  @IsIn(['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'])
  rarity?: string;

  @IsOptional()
  @IsIn(['GK', 'DEF', 'MID', 'FW'])
  position?: string;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc', 'latest'])
  sort?: string;
}

export class ListCardDto {
  @IsString()
  cardId: string;

  @IsInt()
  @Min(1)
  price: number;
}

export class PlaceBidDto {
  @IsInt()
  @Min(50)
  amount: number;
}

export class OpenChestDto {
  @IsIn([
    'common_chest',
    'rare_chest',
    'epic_chest',
    'legendary_chest',
    'world_cup_chest',
    'sponsor_chest',
  ])
  chestType: string;
}

export class PlacePredictionDto {
  @IsString()
  matchId: string;

  @IsString()
  type: string;

  @IsString()
  value: string;

  @IsInt()
  @Min(100)
  @Max(5000)
  betAmount: number;
}
