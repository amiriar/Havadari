import {
  ChestTypeEnum,
  CardRarityEnum,
} from '@app/chests/constants/chest.types';
import { ChestDefinitionEntity } from '@app/chests/entities/chest-definition.entity';
import { DataSource } from 'typeorm';

export async function seedChestDefinitions(dataSource: DataSource) {
  const repo = dataSource.getRepository(ChestDefinitionEntity);

  const rows: Array<Partial<ChestDefinitionEntity>> = [
    {
      type: ChestTypeEnum.COMMON_CHEST,
      isActive: true,
      costFgc: 300,
      costGems: 0,
      cooldownSeconds: 0,
      drops: [
        { type: 'card', rarity: CardRarityEnum.COMMON, probability: 0.75 },
        { type: 'card', rarity: CardRarityEnum.RARE, probability: 0.2 },
        { type: 'fgc', min: 50, max: 200, probability: 0.05 },
      ],
    },
    {
      type: ChestTypeEnum.RARE_CHEST,
      isActive: true,
      costFgc: 900,
      costGems: 40,
      cooldownSeconds: 4 * 60 * 60,
      drops: [
        { type: 'card', rarity: CardRarityEnum.RARE, probability: 0.55 },
        { type: 'card', rarity: CardRarityEnum.EPIC, probability: 0.35 },
        { type: 'card', rarity: CardRarityEnum.LEGENDARY, probability: 0.08 },
        { type: 'gems', min: 10, max: 30, probability: 0.02 },
      ],
    },
    {
      type: ChestTypeEnum.EPIC_CHEST,
      isActive: true,
      costFgc: 0,
      costGems: 100,
      cooldownSeconds: 0,
      drops: [
        { type: 'card', rarity: CardRarityEnum.EPIC, probability: 0.6 },
        { type: 'card', rarity: CardRarityEnum.LEGENDARY, probability: 0.3 },
        { type: 'card', rarity: CardRarityEnum.MYTHIC, probability: 0.08 },
        { type: 'gems', min: 20, max: 50, probability: 0.02 },
      ],
    },
    {
      type: ChestTypeEnum.LEGENDARY_CHEST,
      isActive: true,
      costFgc: 0,
      costGems: 250,
      cooldownSeconds: 0,
      drops: [
        { type: 'card', rarity: CardRarityEnum.LEGENDARY, probability: 0.85 },
        { type: 'card', rarity: CardRarityEnum.MYTHIC, probability: 0.15 },
      ],
    },
  ];

  await repo.upsert(rows, ['type']);
  console.log('Chest definitions seeded');
}
