import {
  MissionMetricEnum,
  MissionTypeEnum,
} from '@app/missions/constants/mission.enums';
import { MissionDefinition } from '@app/missions/entities/mission-definition.entity';
import { DataSource } from 'typeorm';

export async function seedMissionDefinitions(dataSource: DataSource) {
  const repo = dataSource.getRepository(MissionDefinition);

  const rows: Array<Partial<MissionDefinition>> = [
    {
      code: 'daily_open_3_chests',
      title: 'Open 3 Chests',
      description: 'Open any 3 chests today',
      type: MissionTypeEnum.DAILY,
      metric: MissionMetricEnum.OPEN_CHESTS,
      targetValue: 3,
      rewardFgc: 150,
      rewardGems: 0,
      rewardRankPoints: 2,
      isActive: true,
    },
    {
      code: 'daily_sell_1_card',
      title: 'Sell 1 Card',
      description: 'Sell one card in market today',
      type: MissionTypeEnum.DAILY,
      metric: MissionMetricEnum.SELL_CARDS,
      targetValue: 1,
      rewardFgc: 200,
      rewardGems: 0,
      rewardRankPoints: 2,
      isActive: true,
    },
    {
      code: 'daily_buy_1_card',
      title: 'Buy 1 Card',
      description: 'Buy one card in market today',
      type: MissionTypeEnum.DAILY,
      metric: MissionMetricEnum.BUY_CARDS,
      targetValue: 1,
      rewardFgc: 120,
      rewardGems: 0,
      rewardRankPoints: 1,
      isActive: true,
    },
    {
      code: 'weekly_open_10_chests',
      title: 'Open 10 Chests',
      description: 'Open any 10 chests this week',
      type: MissionTypeEnum.WEEKLY,
      metric: MissionMetricEnum.OPEN_CHESTS,
      targetValue: 10,
      rewardFgc: 800,
      rewardGems: 15,
      rewardRankPoints: 8,
      isActive: true,
    },
    {
      code: 'weekly_sell_5_cards',
      title: 'Sell 5 Cards',
      description: 'Sell 5 cards this week',
      type: MissionTypeEnum.WEEKLY,
      metric: MissionMetricEnum.SELL_CARDS,
      targetValue: 5,
      rewardFgc: 1000,
      rewardGems: 20,
      rewardRankPoints: 10,
      isActive: true,
    },
    {
      code: 'weekly_buy_3_cards',
      title: 'Buy 3 Cards',
      description: 'Buy 3 cards this week',
      type: MissionTypeEnum.WEEKLY,
      metric: MissionMetricEnum.BUY_CARDS,
      targetValue: 3,
      rewardFgc: 700,
      rewardGems: 10,
      rewardRankPoints: 6,
      isActive: true,
    },
  ];

  await repo.upsert(rows, ['code']);
  console.log('Mission definitions seeded');
}
