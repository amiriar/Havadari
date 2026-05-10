import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class PlacePredictionDto {
  @ApiProperty()
  @IsUUID()
  matchId: string;

  @ApiProperty()
  @IsString()
  optionKey: string;

  @ApiProperty({ minimum: 100, maximum: 5000 })
  @IsInt()
  @Min(100)
  @Max(5000)
  stakeFgc: number;
}

