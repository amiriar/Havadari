import { CardRarityEnum } from './card.enums';

export const MAX_CARD_LEVEL = 5;

export const UPGRADE_BASE_COST_BY_LEVEL: Record<number, number> = {
  1: 500, // 1 -> 2
  2: 1500, // 2 -> 3
  3: 4000, // 3 -> 4
  4: 10000, // 4 -> 5
};

export const UPGRADE_RARITY_MULTIPLIER: Record<CardRarityEnum, number> = {
  [CardRarityEnum.COMMON]: 1,
  [CardRarityEnum.RARE]: 1.5,
  [CardRarityEnum.EPIC]: 2,
  [CardRarityEnum.LEGENDARY]: 3,
  [CardRarityEnum.MYTHIC]: 5,
};

export const UPGRADE_DUPLICATE_REQUIREMENTS: Record<number, number> = {
  4: 2, // upgrade to level 4
  5: 4, // upgrade to level 5
};

