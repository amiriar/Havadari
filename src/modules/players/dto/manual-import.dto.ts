import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PlayerPositionEnum,
  PlayerProviderEnum,
} from '../constants/player.enums';

class ManualPlayerStatDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  providerPlayerId: string;

  @ApiPropertyOptional({ default: 2026 })
  @IsOptional()
  @IsInt()
  season?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  appearances?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  minutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  goals?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  assists?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  shots?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  passes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  tackles?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  interceptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  dribbles?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  yellowCards?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  redCards?: number;
}

class ManualPlayerDto {
  @ApiProperty({ enum: PlayerProviderEnum })
  @IsEnum(PlayerProviderEnum)
  provider: PlayerProviderEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  providerPlayerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  competitionCode?: string;

  @ApiPropertyOptional({ enum: PlayerPositionEnum })
  @IsOptional()
  @IsEnum(PlayerPositionEnum)
  position?: PlayerPositionEnum;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(200)
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rawPayload?: Record<string, unknown>;
}

export class ManualImportPlayersDto {
  @ApiProperty({ type: [ManualPlayerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualPlayerDto)
  players: ManualPlayerDto[];

  @ApiPropertyOptional({ type: [ManualPlayerStatDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ManualPlayerStatDto)
  stats?: ManualPlayerStatDto[];

  @ApiPropertyOptional({ default: 2026 })
  @IsOptional()
  @IsInt()
  season?: number;
}
