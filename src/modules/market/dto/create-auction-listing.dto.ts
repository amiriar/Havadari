import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { AuctionDurationHoursEnum } from '../constants/market.types';

export class CreateAuctionListingDto {
  @ApiProperty()
  @IsUUID('4')
  userCardId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  startPrice: number;

  @ApiProperty({
    enum: AuctionDurationHoursEnum,
    default: AuctionDurationHoursEnum.H12,
  })
  @IsInt()
  @IsEnum(AuctionDurationHoursEnum)
  durationHours: AuctionDurationHoursEnum;
}
