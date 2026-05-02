import { SmsTemplateEntity } from '@app/sms-template/entities/sms-template.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsTemplateParameterEntity } from './entities/sms-template-parameter.entity';

@Injectable()
export class SmsTemplateParameterService {
  constructor(
    @InjectRepository(SmsTemplateParameterEntity)
    private readonly repo: Repository<SmsTemplateParameterEntity>,
  ) {}

  async create(
    templateId: string,
    parameterId: string,
    template: SmsTemplateEntity,
  ): Promise<SmsTemplateParameterEntity> {
    const templateParameter = this.repo.create({
      templateId,
      parameterId,
      template,
    });

    return await this.repo.save(templateParameter);
  }

  async deleteByTemplateId(templateId: string) {
    return await this.repo.delete({ templateId });
  }
}
