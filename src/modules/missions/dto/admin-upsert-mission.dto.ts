import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MissionMetricEnum, MissionTypeEnum } from '../constants/mission.enums';

export class AdminUpsertMissionDto {
  @ApiProperty({ example: 'dm_first_win' })
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ enum: MissionTypeEnum })
  @IsEnum(MissionTypeEnum)
  type: MissionTypeEnum;

  @ApiProperty({ enum: MissionMetricEnum })
  @IsEnum(MissionMetricEnum)
  metric: MissionMetricEnum;

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
  rewardRankPoints?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

