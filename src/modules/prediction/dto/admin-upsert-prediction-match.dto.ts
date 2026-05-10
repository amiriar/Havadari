import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PredictionMatchStatusEnum } from '../constants/prediction.enums';

export class AdminUpsertPredictionMatchDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  externalMatchId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  homeTeam: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  awayTeam: string;

  @ApiProperty({ description: 'ISO datetime' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ enum: PredictionMatchStatusEnum })
  @IsOptional()
  @IsEnum(PredictionMatchStatusEnum)
  status?: PredictionMatchStatusEnum;
}

