import { DataSource } from 'typeorm';

export async function seedAchievements(_dataSource: DataSource): Promise<void> {
  console.log('skipping achievements seeding: module not present in this build');
}
