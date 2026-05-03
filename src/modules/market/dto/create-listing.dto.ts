import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsUUID, Min } from 'class-validator';
import { ListingDurationHoursEnum } from '../constants/market.types';

export class CreateListingDto {
  @ApiProperty()
  @IsUUID('4')
  userCardId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  price: number;

  @ApiProperty({ enum: ListingDurationHoursEnum, default: ListingDurationHoursEnum.H24 })
  @IsInt()
  @IsEnum(ListingDurationHoursEnum)
  durationHours: ListingDurationHoursEnum;
}
