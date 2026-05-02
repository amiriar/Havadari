import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  country?: string;
}

export class UpdateSquadDto {
  @IsArray()
  @IsString({ each: true })
  cardOwnershipIds: string[];
}

export class StartBattleDto {
  @IsOptional()
  @IsString()
  type?: 'classic' | 'ranked' | 'tournament' | 'duos';
}

export class PlayRoundDto {
  @IsString()
  battleId: string;

  @IsString()
  player1CardOwnershipId: string;

  @IsString()
  category: 'speed' | 'power' | 'skill' | 'attack' | 'defend';
}

export class EndBattleDto {
  @IsString()
  battleId: string;
}

export class ListCardDto {
  @IsString()
  userCardId: string;

  @IsInt()
  @Min(1)
  price: number;
}

export class PlaceBidDto {
  @IsInt()
  @Min(50)
  amount: number;
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
