import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsUUID, MaxLength } from 'class-validator';

export class AdminUpsertPredictionOptionDto {
  @ApiProperty()
  @IsUUID()
  matchId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  optionKey: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;
}

