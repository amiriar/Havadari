import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BattleModeEnum, BattleRegionEnum } from '../constants/battle.enums';

export class FindMatchDto {
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

  @ApiPropertyOptional({ default: 30, minimum: 5, maximum: 60 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(60)
  timeoutSeconds?: number;
}
