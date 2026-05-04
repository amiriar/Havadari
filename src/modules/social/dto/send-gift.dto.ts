import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { GiftTypeEnum } from '../constants/social.enums';

export class SendGiftDto {
  @ApiProperty()
  @IsUUID('4')
  toUserId: string;

  @ApiProperty({ enum: GiftTypeEnum, default: GiftTypeEnum.FGC })
  @IsEnum(GiftTypeEnum)
  type: GiftTypeEnum;

  @ApiProperty({ required: false, description: 'Required when type=CHEST' })
  @IsOptional()
  chestType?: string;
}

