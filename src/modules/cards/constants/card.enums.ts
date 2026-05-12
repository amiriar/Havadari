import {
  PlayerPositionEnum,
  PlayerProviderEnum,
} from '@app/players/constants/player.enums';

export enum CardRarityEnum {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  IDOL = 'IDOL',
}

export enum CardEditionEnum {
  BASE = 'BASE',
}

export enum AvatarStatusEnum {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  FAILED = 'FAILED',
}

export enum AvatarGenerationRunStatusEnum {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum UserCardAcquiredFromEnum {
  CHEST = 'chest',
  MARKET = 'market',
  EVENT = 'event',
  STARTER = 'starter',
}

export { PlayerPositionEnum, PlayerProviderEnum };
