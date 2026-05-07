import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LeaderboardTypeEnum } from '../constants/leaderboard.enums';

export class AdminUpsertLeaderboardRewardDto {
  @ApiProperty({ enum: LeaderboardTypeEnum })
  @IsEnum(LeaderboardTypeEnum)
  type: LeaderboardTypeEnum;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  rankFrom: number;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  rankTo: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  rewardFgc: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  rewardGems: number;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  rewardChest?: string | null;
}

