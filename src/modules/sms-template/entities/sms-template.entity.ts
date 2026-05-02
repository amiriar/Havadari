import { SmsTemplateParameterEntity } from '@app/smsTemplateParameter/entities/sms-template-parameter.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { entityNames } from '@common/enums/entityNames.enum';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity(entityNames.SMS_TEMPLATE)
export class SmsTemplateEntity extends ApplicationBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  text: string;

  @OneToMany(
    () => SmsTemplateParameterEntity,
    (templateParameter) => templateParameter.template,
  )
  templateParameters!: SmsTemplateParameterEntity[];
}
