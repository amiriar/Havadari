import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { LeaderboardTypeEnum } from '../constants/leaderboard.enums';

export class GetLeaderboardQueryDto {
  @ApiPropertyOptional({
    enum: LeaderboardTypeEnum,
    default: LeaderboardTypeEnum.CLASSIC,
  })
  @IsOptional()
  @IsEnum(LeaderboardTypeEnum)
  type?: LeaderboardTypeEnum;

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
}
