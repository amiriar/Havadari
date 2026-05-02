import { SmsTemplateParameterService } from '@app/smsTemplateParameter/sms-template-parameter.service';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSmsTemplateDto } from './dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from './dto/update-sms-template.dto';
import { SmsTemplateEntity } from './entities/sms-template.entity';
import { SmsTemplateControllerCode } from './constants/controller-codes';

@Injectable()
export class SmsTemplateService {
  constructor(
    @InjectRepository(SmsTemplateEntity)
    private readonly repo: Repository<SmsTemplateEntity>,
    private readonly smsTemplateParameterService: SmsTemplateParameterService,
  ) {}

  async create(
    createSmsTemplateDto: CreateSmsTemplateDto,
  ): Promise<SmsTemplateEntity> {
    const { name, text, parameterIds } = createSmsTemplateDto;

    // create SmsTemplate record
    const smsTemplate = this.repo.create({
      name,
      text,
    });

    const savedTemplate = await this.repo.save(smsTemplate);

    if (parameterIds && parameterIds.length > 0) {
      for (const parameterId of parameterIds) {
        // create SmsTemplateParameter record
        await this.smsTemplateParameterService.create(
          savedTemplate.id,
          parameterId,
          savedTemplate,
        );
      }
    }

    return savedTemplate;
  }

  async findAll(): Promise<SmsTemplateEntity[]> {
    return this.repo.find({
      relations: ['templateParameters'], // Ensure related parameters are loaded
    });
  }
  async findOne(templateId: string): Promise<SmsTemplateEntity> {
    const template = await this.repo.findOne({
      where: { id: templateId },
      relations: ['templateParameters', 'templateParameters.parameter'],
    });

    if (!template) {
      throw new NotFoundException({
        code: `${SmsTemplateControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'SmsTemplate' }),
      });
    }

    return template;
  }

  async update(id: string, updateSmsTemplateDto: UpdateSmsTemplateDto) {
    const smsTemplateToUpdate = await this.findOne(id);

    Object.assign(smsTemplateToUpdate, updateSmsTemplateDto);
    if (updateSmsTemplateDto.parameterIds?.length) {
      await this.smsTemplateParameterService.deleteByTemplateId(id);
      await Promise.all(
        updateSmsTemplateDto.parameterIds.map(async (parameterId) => {
          return await this.smsTemplateParameterService.create(
            id,
            parameterId,
            smsTemplateToUpdate,
          );
        }),
      );
      delete smsTemplateToUpdate.templateParameters;
    }
    return await this.repo.save(smsTemplateToUpdate);
  }

  async remove(templateId: string) {
    await this.findOne(templateId);
    await this.repo.delete({ id: templateId });
  }
}
