import { File } from '@app/file/entities/file.entity';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import * as fs from 'fs';
import { config } from 'dotenv';
import { User } from '@app/auth/entities/user.entity';

config();

export async function seedFiles(dataSource: DataSource): Promise<void> {
  console.log('seeding files');

  const file = fs.readFileSync('./file.csv');

  const data = file.toString().split('\n');
  let userFiles = [];
  let filesToInsert: Array<DeepPartial<File>> = [];
  let userFile;

  const userRepository: Repository<User> = dataSource.getRepository(User);

  const repository: Repository<File> = dataSource.getRepository(File);

  const users = await userRepository.find({
    select: { id: true },
  });

  for (const user of users) {
    userFiles = [];
    filesToInsert = [];

    userFiles.forEach((row) => {
      userFile = row.split(',');
      filesToInsert.push({
        path: userFile[1].replace('/Media/Document', '/uploads'),
        title: userFile[2],
        url: `${process.env.STATIC_ASSET_ORIGIN}${userFile[1].replace('/Media/Document', '/uploads')}`,
        relatedEntity: User.name,
        relatedId: user.id,
        relationType: 'patient-document',
        mimeType: 'file',
      });
    });

    if (filesToInsert.length == 0) {
      continue;
    }

    await repository.insert(filesToInsert);
  }

  console.log('files seeded\n');

  return;
}
