import { SmsTemplateParameterEntity } from '@app/smsTemplateParameter/entities/sms-template-parameter.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { entityNames } from '@common/enums/entityNames.enum';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity(entityNames.TEMPLATE_PARAMETER)
export class TemplateParameterEntity extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  name?: string;

  @OneToMany(
    () => SmsTemplateParameterEntity,
    (templateParameter) => templateParameter.parameter,
  )
  templateParameters!: SmsTemplateParameterEntity[];
}

