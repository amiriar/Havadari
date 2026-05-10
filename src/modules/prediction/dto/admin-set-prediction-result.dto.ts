import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class AdminSetPredictionResultDto {
  @ApiProperty()
  @IsUUID()
  matchId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(64)
  resultOptionKey: string;
}

