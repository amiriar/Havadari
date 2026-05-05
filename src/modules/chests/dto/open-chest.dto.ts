import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ChestTypeEnum } from '../constants/chest.types';

export class OpenChestDto {
  @ApiProperty({ enum: ChestTypeEnum })
  @IsEnum(ChestTypeEnum)
  type: ChestTypeEnum;
}
