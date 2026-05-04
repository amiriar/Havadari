import { ListingStatusEnum } from './listing-status.enum';

export type ListingStatus = ListingStatusEnum;

export enum ListingTypeEnum {
  FIXED = 'fixed',
  AUCTION = 'auction',
}

export enum ListingDurationHoursEnum {
  H24 = 24,
  H48 = 48,
  H72 = 72,
}

export enum AuctionDurationHoursEnum {
  H12 = 12,
  H24 = 24,
}
