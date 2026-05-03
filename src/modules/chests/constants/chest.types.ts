export enum CardRarityEnum {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

export enum ChestTypeEnum {
  COMMON_CHEST = 'common_chest',
  RARE_CHEST = 'rare_chest',
  EPIC_CHEST = 'epic_chest',
  LEGENDARY_CHEST = 'legendary_chest',
}

export type ChestDefinition = {
  type: ChestTypeEnum;
  cost: { fgc?: number; gems?: number };
  cooldownSeconds: number;
  drops: Array<
    | { type: 'card'; rarity: CardRarityEnum; probability: number }
    | { type: 'fgc'; min: number; max: number; probability: number }
    | { type: 'gems'; min: number; max: number; probability: number }
  >;
};
