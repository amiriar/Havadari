import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  Length,
  ValidateIf,
} from 'class-validator';
import {
  BattleModeEnum,
  BattleOpponentTypeEnum,
  BattleRegionEnum,
} from '../constants/battle.enums';

export class StartBattleDto {
  @ApiPropertyOptional({
    enum: BattleModeEnum,
    default: BattleModeEnum.CLASSIC,
  })
  @IsOptional()
  @IsEnum(BattleModeEnum)
  mode?: BattleModeEnum;

  @ApiPropertyOptional({
    enum: BattleRegionEnum,
    default: BattleRegionEnum.GLOBAL,
  })
  @IsOptional()
  @IsEnum(BattleRegionEnum)
  region?: BattleRegionEnum;

  @ApiPropertyOptional({
    enum: BattleOpponentTypeEnum,
    default: BattleOpponentTypeEnum.BOT,
  })
  @IsOptional()
  @IsEnum(BattleOpponentTypeEnum)
  opponentType?: BattleOpponentTypeEnum;

  @ApiPropertyOptional()
  @ValidateIf(
    (dto: StartBattleDto) => dto.opponentType === BattleOpponentTypeEnum.PVP,
  )
  @IsUUID('4')
  opponentUserId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Exactly 5 user card ids. If omitted, active squad is used.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userCardIds?: string[];

  @ApiPropertyOptional({ description: 'Optional token returned by find-match' })
  @IsOptional()
  @Length(8, 128)
  matchToken?: string;
}
