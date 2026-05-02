export type CardRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export type ChestType =
  | 'common_chest'
  | 'rare_chest'
  | 'epic_chest'
  | 'legendary_chest';

export type ChestDefinition = {
  type: ChestType;
  cost: { fgc?: number; gems?: number };
  cooldownSeconds: number;
  drops: Array<
    | { type: 'card'; rarity: CardRarity; probability: number }
    | { type: 'fgc'; min: number; max: number; probability: number }
    | { type: 'gems'; min: number; max: number; probability: number }
  >;
};
