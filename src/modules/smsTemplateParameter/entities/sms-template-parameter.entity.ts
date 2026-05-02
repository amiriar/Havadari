import { SmsTemplateEntity } from '@app/sms-template/entities/sms-template.entity';
import { TemplateParameterEntity } from '@app/templateParameter/entities/template-parameter.entity';
import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { entityNames } from '@common/enums/entityNames.enum';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

@Entity(entityNames.SMS_TEMPLATE_PARAMETER)
@Unique(['templateId', 'parameterId'])
export class SmsTemplateParameterEntity extends ApplicationBaseEntity {
  @Column({ type: 'uuid' })
  templateId!: string;

  @ManyToOne(
    () => SmsTemplateEntity,
    (template) => template.templateParameters,
    {
      onDelete: 'NO ACTION',
    },
  )
  @JoinColumn({ name: 'templateId' })
  template!: SmsTemplateEntity;

  @Column({ type: 'uuid' })
  parameterId!: string;

  @ManyToOne(
    () => TemplateParameterEntity,
    (parameter) => parameter.templateParameters,
    {
      onDelete: 'NO ACTION',
    },
  )
  @JoinColumn({ name: 'parameterId' })
  parameter!: TemplateParameterEntity;
}
