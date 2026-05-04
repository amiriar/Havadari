import { AchievementMetricEnum } from '@app/achievements/constants/achievement.enums';
import { AchievementDefinition } from '@app/achievements/entities/achievement-definition.entity';
import { DataSource } from 'typeorm';

export async function seedAchievements(dataSource: DataSource) {
  const repo = dataSource.getRepository(AchievementDefinition);
  const rows: Array<Partial<AchievementDefinition>> = [
    {
      code: 'ach_open_50_chests',
      title: 'Treasure Hunter',
      description: 'Open 50 chests',
      metric: AchievementMetricEnum.OPEN_CHESTS,
      targetValue: 50,
      rewardFgc: 1500,
      rewardGems: 20,
      rewardTrophies: 20,
      rewardExp: 120,
      isActive: true,
    },
    {
      code: 'ach_sell_25_cards',
      title: 'Market Seller',
      description: 'Sell 25 cards',
      metric: AchievementMetricEnum.SELL_CARDS,
      targetValue: 25,
      rewardFgc: 1200,
      rewardGems: 10,
      rewardTrophies: 15,
      rewardExp: 100,
      isActive: true,
    },
    {
      code: 'ach_buy_25_cards',
      title: 'Collector Buyer',
      description: 'Buy 25 cards',
      metric: AchievementMetricEnum.BUY_CARDS,
      targetValue: 25,
      rewardFgc: 1200,
      rewardGems: 10,
      rewardTrophies: 15,
      rewardExp: 100,
      isActive: true,
    },
    {
      code: 'ach_daily_login_7',
      title: 'Weekly Loyal',
      description: 'Claim daily login reward 7 times',
      metric: AchievementMetricEnum.DAILY_LOGIN_CLAIMS,
      targetValue: 7,
      rewardFgc: 700,
      rewardGems: 5,
      rewardTrophies: 8,
      rewardExp: 60,
      isActive: true,
    },
    {
      code: 'ach_collect_100_cards',
      title: 'Card Collector',
      description: 'Collect 100 cards',
      metric: AchievementMetricEnum.COLLECT_CARDS,
      targetValue: 100,
      rewardFgc: 3000,
      rewardGems: 40,
      rewardTrophies: 30,
      rewardExp: 200,
      isActive: true,
    },
  ];
  await repo.upsert(rows, ['code']);
  console.log('Achievements seeded');
}
