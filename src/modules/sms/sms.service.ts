import { User } from '@app/auth/entities/user.entity';
import { UserService } from '@app/auth/services/user.service';
import { SmsTemplateService } from '@app/sms-template/sms-template.service';
import { SmsTemplateParameterEntity } from '@app/smsTemplateParameter/entities/sms-template-parameter.entity';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Handlebars from 'handlebars';
import {
  FilterOperator,
  FilterSuffix,
  paginate,
  Paginated,
  PaginateQuery,
} from 'nestjs-paginate';
import { LessThanOrEqual } from 'typeorm';
import { ISender } from '../../common/interfaces/sender.interface';
import { SaveDraftDto } from './dto/save-draf.dto';
import { SendGroupDraftDto } from './dto/send-group-draft.dto';
import { SendGroupSmsDto } from './dto/send-group-sms.dto';
import { SendQuickSmsDto } from './dto/send-quick-sms.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsEntity } from './entities/sms.entity';
import { SmsStatusType } from './enums/sms-status.enum';
import { SmsRepository } from './repository/sms.repository';
import { SmsControllerCode } from './constants/controller-codes';

@Injectable()
export class SmsService implements ISender {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
  private readonly kavenegarSender = process.env.KAVENEGAR_SENDER;
  private readonly kavenegarOtpTemplate =
    process.env.KAVENEGAR_OTP_TEMPLATE || 'verify';

  constructor(
    private readonly smsTemplateService: SmsTemplateService,
    private readonly userService: UserService,
    private readonly smsRepository: SmsRepository,
  ) {}

  /**
   * Sends an SMS message using the provided DTO.
   *
   * @param sendSmsDto - An object containing the recipient's phone number and the SMS text.
   * @param isFlash - Optional boolean indicating whether to send as a flash SMS. Defaults to false.
   * @returns A Promise that resolves to a smsProviderId if the SMS is sent successfully.
   * @throws {InternalServerErrorException} Throws an exception if an error occurs while sending the SMS.
   */
  async sendSmsHandler(
    sendSmsDto: SendQuickSmsDto,
    _isFlash: boolean = false,
  ): Promise<string> {
    return this.sendWithKavenegar(sendSmsDto);
  }

  private async sendWithKavenegar(
    sendSmsDto: SendQuickSmsDto,
  ): Promise<string> {
    if (this.isDevelopment) {
      return 'dev-sms-skipped';
    }

    const { phoneNumber, text } = sendSmsDto;
    if (!this.kavenegarApiKey) {
      throw new InternalServerErrorException({
        code: `${SmsControllerCode}01`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'KAVENEGAR_API_KEY is not configured',
      });
    }

    const url = `https://api.kavenegar.com/v1/${this.kavenegarApiKey}/sms/send.json`;
    const params = new URLSearchParams({
      receptor: phoneNumber,
      message: text,
    });
    if (this.kavenegarSender) {
      params.set('sender', this.kavenegarSender);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const body = await response.json().catch(() => null);
    const status = body?.return?.status;

    if (!response.ok || status !== 200) {
      throw new InternalServerErrorException({
        code: `${SmsControllerCode}01`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: body?.return?.message || 'Kavenegar SMS sending failed',
      });
    }

    return String(body?.entries?.[0]?.messageid || 'kavenegar-sent');
  }

  async sendOtp(recipient: string, otp: string): Promise<string> {
    return this.sendOtpWithKavenegar(recipient, otp);
  }

  private async sendOtpWithKavenegar(
    recipient: string,
    otp: string,
  ): Promise<string> {
    if (this.isDevelopment) {
      return 'dev-otp-skipped';
    }

    if (!this.kavenegarApiKey) {
      throw new InternalServerErrorException({
        code: `${SmsControllerCode}06`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'KAVENEGAR_API_KEY is not configured',
      });
    }

    const url = `https://api.kavenegar.com/v1/${this.kavenegarApiKey}/verify/lookup.json`;
    const params = new URLSearchParams({
      receptor: recipient,
      token: otp,
      template: this.kavenegarOtpTemplate,
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const body = await response.json().catch(() => null);
    const status = body?.return?.status;
    if (!response.ok || status !== 200) {
      throw new InternalServerErrorException({
        code: `${SmsControllerCode}06`,
        statusCode: HttpStatus.BAD_GATEWAY,
        message: body?.return?.message || 'Kavenegar OTP sending failed',
      });
    }
    return 'otp sent successfully';
  }

  async send(
    recipient: string,
    message: string,
    isFlash: boolean = false,
  ): Promise<string> {
    const sendOneSmsResult = await this.sendSmsHandler(
      {
        phoneNumber: recipient,
        text: message,
      },
      isFlash,
    );
    if (!sendOneSmsResult)
      throw new InternalServerErrorException({
        code: `${SmsControllerCode}02`,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'something went wrong',
      });
    return `message sent successfuly`;
  }

  async sendSms(dto: SendSmsDto, isFlash?: boolean) {
    const textMessage = await this.resolveTextMessage(dto);
    const sms = await this.createSmsRecord(
      dto,
      textMessage,
      SmsStatusType.PENDING,
    );
    if (dto.scheduleSms && new Date(dto.scheduleSms) > new Date()) {
      return sms;
    }
    const sendSmsId = await this.sendSmsHandler(
      { phoneNumber: dto.phoneNumber, text: textMessage },
      isFlash,
    );
    await this.smsRepository.updateAndReturn(sms, {
      status: SmsStatusType.SENT,
      providerMessageId: sendSmsId,
    });

    return sms;
  }

  async sendGroupSms(dto: SendGroupSmsDto) {
    const results = [];

    for (const messageDto of dto.messages) {
      try {
        const result = await this.sendSms(messageDto, dto.isFlash);
        results.push({ success: true, sms: result });
      } catch (error: Error | any) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  async saveAsDraft(dto: SaveDraftDto) {
    const textMessage = await this.resolveTextMessage(dto);

    const sms = await this.createSmsRecord(
      dto,
      textMessage,
      SmsStatusType.DRAFT,
    );

    return this.smsRepository.save(sms);
  }
  async saveGroupDrafts(dto: SendGroupSmsDto) {
    const results = [];

    for (const messageDto of dto.messages) {
      try {
        const result = await this.saveAsDraft(messageDto);
        results.push({ success: true, sms: result });
      } catch (error: Error | any) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  async sendDraft(id: string) {
    const sms = await this.smsRepository.findOne({
      where: { id, status: SmsStatusType.DRAFT },
    });

    if (!sms) {
      throw new NotFoundException({
        code: `${SmsControllerCode}03`,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Draft not found',
      });
    }

    const sendSmsId = await this.sendSmsHandler({
      phoneNumber: sms.phoneNumber,
      text: sms.text,
    });

    return this.smsRepository.updateAndReturn(sms, {
      status: SmsStatusType.SENT,
      providerMessageId: sendSmsId,
    });
  }

  async sendGroupDrafts(dto: SendGroupDraftDto) {
    const results = [];

    for (const draftId of dto.draftIds) {
      try {
        const result = await this.sendDraft(draftId);
        results.push({ success: true, sms: result });
      } catch (error: Error | any) {
        results.push({ success: false, draftId, error: error.message });
      }
    }

    return results;
  }
  async cancelScheduledSms(id: string): Promise<SmsEntity> {
    const sms = await this.smsRepository.findOne({
      where: { id, status: SmsStatusType.PENDING },
    });

    if (!sms) {
      throw new NotFoundException({
        code: `${SmsControllerCode}04`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'sms' }),
      });
    }

    return this.smsRepository.updateAndReturn(sms, {
      status: SmsStatusType.CANCELED,
    });
  }

  async sendScheduled(id: string) {
    const scheduledSms = await this.smsRepository.findOne({ where: { id } });
    const sendSmsId = await this.sendSmsHandler({
      phoneNumber: scheduledSms.phoneNumber,
      text: scheduledSms.text,
    });
    const updated = await this.smsRepository.updateAndReturn(scheduledSms, {
      status: SmsStatusType.SENT,
      providerMessageId: sendSmsId,
    });

    return updated;
  }

  async bulkDelete(ids: string[]) {
    await this.smsRepository.delete(ids);
    return;
  }

  private async resolveTextMessage(dto: SendSmsDto): Promise<string> {
    if (dto.templateId) {
      const message = await this.getMessageText(dto);
      if (!message) {
        throw new NotFoundException({
          code: `${SmsControllerCode}05`,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Template not found or returned empty text',
        });
      }
      return message;
    }

    // if (!dto.text) {
    //   throw new BadRequestException('Select a template or provide a text');
    // }

    return dto.text;
  }

  private async getMessageText(dto: SendSmsDto): Promise<string> {
    const template = await this.smsTemplateService.findOne(dto.templateId);
    let textMessage = template.text;
    const user = await this.userService.findOne(dto.userId);

    if (template.templateParameters) {
      textMessage = this.replaceTemplateParams(
        template.templateParameters,
        textMessage,
        user,
      );
    }

    return textMessage;
  }

  private replaceTemplateParams(
    parameters: SmsTemplateParameterEntity[],
    textMessage: string,
    user: User,
  ): string {
    const templateParams: { [key: string]: string } = {};

    parameters.forEach((param) => {
      const parameterKey = param.parameter.name;
      const parameterValue = this.getParameterValue(parameterKey, user);
      templateParams[parameterKey] = parameterValue;
    });

    const template = Handlebars.compile(textMessage);
    const processedMessage = template(templateParams);

    return processedMessage;
  }

  private getParameterValue(
    parameterKey: string,
    user: User,
  ): string | undefined {
    switch (parameterKey) {
      case 'fullname':
        return user.fullName;
      default:
        return undefined;
    }
  }

  private async createSmsRecord(
    dto: SendSmsDto,
    text: string,
    status: SmsStatusType,
  ): Promise<SmsEntity> {
    let user = null;
    if (dto.templateId && dto.userId) {
      user = await this.userService.findOne(dto.userId);
    }
    const sms = this.smsRepository.create({
      phoneNumber: dto.phoneNumber,
      scheduleSms: new Date(dto.scheduleSms),
      user,
      text,
      status,
    });

    return this.smsRepository.save(sms);
  }

  async findAll(
    query: PaginateQuery,
    url: string,
  ): Promise<Paginated<SmsEntity>> {
    return paginate(query, this.smsRepository, {
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['user.fullName'],
      select: [
        'id',
        'phoneNumber',
        'text',
        'status',
        'scheduleSms',
        'createdAt',
        'updatedAt',
        'user',
        'user.fullName',
      ],
      relations: ['user'],
      filterableColumns: {
        phoneNumber: [FilterOperator.EQ, FilterSuffix.NOT],
        status: [FilterOperator.EQ, FilterSuffix.NOT],
      },
      origin: url,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE) // Job will complete every 1 minute
  async handleScheduledSms() {
    const now = new Date();
    const pendingSmsList = await this.smsRepository.find({
      where: {
        scheduleSms: LessThanOrEqual(now),
        status: SmsStatusType.PENDING,
      },
    });
    for (const sms of pendingSmsList) {
      const sendSmsId = await this.sendSmsHandler({
        phoneNumber: sms.phoneNumber,
        text: sms.text,
      });

      await this.smsRepository.update(
        { id: sms.id },
        {
          status: SmsStatusType.SENT,
          providerMessageId: sendSmsId,
        },
      );
    }
  }
}
