import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClanDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ required: false, default: 30, minimum: 5, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  maxMembers?: number;
}
