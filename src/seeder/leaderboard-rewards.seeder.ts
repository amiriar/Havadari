import { LeaderboardReward } from '@app/leaderboard/entities/leaderboard-reward.entity';
import { LeaderboardTypeEnum } from '@app/leaderboard/constants/leaderboard.enums';
import { DataSource, DeepPartial, Repository } from 'typeorm';

function defaultRewards(
  type: LeaderboardTypeEnum,
): Array<DeepPartial<LeaderboardReward>> {
  return [
    {
      type,
      rankFrom: 1,
      rankTo: 1,
      rewardFgc: 20000,
      rewardGems: 300,
      rewardChest: 'mythic x2',
    },
    {
      type,
      rankFrom: 2,
      rankTo: 3,
      rewardFgc: 10000,
      rewardGems: 150,
      rewardChest: 'legendary x2',
    },
    {
      type,
      rankFrom: 4,
      rankTo: 10,
      rewardFgc: 5000,
      rewardGems: 60,
      rewardChest: 'epic',
    },
    {
      type,
      rankFrom: 11,
      rankTo: 50,
      rewardFgc: 2000,
      rewardGems: 20,
      rewardChest: 'rare',
    },
    {
      type,
      rankFrom: 51,
      rankTo: 100,
      rewardFgc: 500,
      rewardGems: 5,
      rewardChest: null,
    },
  ];
}

export async function seedLeaderboardRewards(
  dataSource: DataSource,
): Promise<void> {
  console.log('seeding leaderboard rewards');

  const repository: Repository<LeaderboardReward> =
    dataSource.getRepository(LeaderboardReward);

  const all: Array<DeepPartial<LeaderboardReward>> = [];
  for (const type of Object.values(LeaderboardTypeEnum)) {
    all.push(...defaultRewards(type));
  }

  await repository.upsert(all, {
    conflictPaths: ['type', 'rankFrom', 'rankTo'],
  });

  console.log('Leaderboard rewards seeded\n');
}
