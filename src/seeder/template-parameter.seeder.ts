import { TemplateParameterEntity } from '@app/templateParameter/entities/template-parameter.entity';
import { DataSource, DeepPartial, Repository } from 'typeorm';

const templateParameters: Array<DeepPartial<TemplateParameterEntity>> = [
  //Quard 1 upper right

  {
    name: 'fullname',
  },
];

export async function seedTemplateParameters(
  dataSource: DataSource,
): Promise<void> {
  console.log('seeding template-parameters');

  const repository: Repository<TemplateParameterEntity> =
    dataSource.getRepository(TemplateParameterEntity);

  await repository.upsert(templateParameters, {
    conflictPaths: { name: true },
  });

  console.log('template-parameters seeded\n');

  return;
}
