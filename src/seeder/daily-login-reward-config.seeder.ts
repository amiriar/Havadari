import { DailyLoginRewardConfig } from '@app/auth/entities/daily-login-reward-config.entity';
import { DataSource } from 'typeorm';

export async function seedDailyLoginRewardConfig(dataSource: DataSource) {
  const repo = dataSource.getRepository(DailyLoginRewardConfig);
  const rows: Array<Partial<DailyLoginRewardConfig>> = [
    { day: 1, rewardFgc: 50, rewardGems: 0 },
    { day: 2, rewardFgc: 60, rewardGems: 0 },
    { day: 3, rewardFgc: 70, rewardGems: 0 },
    { day: 4, rewardFgc: 80, rewardGems: 0 },
    { day: 5, rewardFgc: 100, rewardGems: 0 },
    { day: 6, rewardFgc: 120, rewardGems: 0 },
    { day: 7, rewardFgc: 150, rewardGems: 0 },
  ];

  await repo.upsert(rows, ['day']);
  console.log('Daily login reward config seeded');
}
