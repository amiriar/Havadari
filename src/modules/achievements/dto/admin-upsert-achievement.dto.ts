import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AchievementMetricEnum } from '../constants/achievement.enums';

export class AdminUpsertAchievementDto {
  @ApiProperty({ example: 'ach_first_win' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: AchievementMetricEnum })
  @IsEnum(AchievementMetricEnum)
  metric: AchievementMetricEnum;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  targetValue: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardFgc?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardGems?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardTrophies?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardExp?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

