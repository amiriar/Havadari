import { PaginateQueryOptions } from '@common/decorators/paginate-query-optionts.decorator';
import {
  CREATE_SMS,
  READ_SMS,
  UPDATE_SMS,
} from '@common/constants/permissions_name/sms';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { AtMostOne } from '@common/pipes/at-most-one.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { PaginatedSmsResponse } from './dto/paginated-sms-response.dto';
import { SaveDraftDto } from './dto/save-draf.dto';
import { SendDraftDto } from './dto/send-draft.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsEntity } from './entities/sms.entity';
import { SmsService } from './sms.service';
import { SendGroupSmsDto } from './dto/send-group-sms.dto';
import { SendGroupDraftDto } from './dto/send-group-draft.dto';
import { SaveGroupDrafts } from './dto/save-group-drafts.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { Url } from '@common/decorators/url.decorator';
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Get()
  @PaginateQueryOptions({
    filterOptions: [
      { field: 'phoneNumber', example: '$eq:09385051602' },
      { field: 'status', example: '$eq:sent' },
    ],
    sortOptions: [{ example: 'createdAt:ASC' }, { example: 'updatedAt:ASC' }],
  })
  @ApiOkResponse({ type: PaginatedSmsResponse })
  @AuthorizeByPermissions([READ_SMS])
  async findAll(
    @Paginate() query: PaginateQuery,
    @Url({ excludePath: true }) url: string,
  ) {
    return await this.smsService.findAll(query, url);
  }

  @UsePipes(new AtMostOne(['templateId', 'text']))
  @AuthorizeByPermissions([CREATE_SMS])
  @Post('send')
  async send(@Body() sendSmsDto: SendSmsDto): Promise<SmsEntity> {
    return this.smsService.sendSms(sendSmsDto);
  }

  @Post('send/group')
  async sendGroupSms(@Body() dto: SendGroupSmsDto) {
    return this.smsService.sendGroupSms(dto);
  }

  @Post('sendQuick')
  @AuthorizeByPermissions([CREATE_SMS])
  async sendQuick(@Body() sendSmsDto: SendSmsDto): Promise<SmsEntity> {
    return await this.smsService.sendSms(sendSmsDto, true);
  }

  @UsePipes(new AtMostOne(['templateId', 'text']))
  @AuthorizeByPermissions([CREATE_SMS])
  @Post('save-draft-sms')
  async saveDraft(@Body() saveDraftDto: SaveDraftDto): Promise<SmsEntity> {
    return await this.smsService.saveAsDraft(saveDraftDto);
  }

  @Post('save-group-drafts')
  async saveGroupDrafts(@Body() dto: SaveGroupDrafts) {
    return this.smsService.saveGroupDrafts(dto);
  }

  @Post('send-draft-sms')
  @AuthorizeByPermissions([UPDATE_SMS])
  async sendDraft(@Body() sendDraftDto: SendDraftDto): Promise<SmsEntity> {
    return await this.smsService.sendDraft(sendDraftDto.id);
  }

  @Post('send/group-drafts')
  async sendGroupDrafts(@Body() dto: SendGroupDraftDto) {
    return this.smsService.sendGroupDrafts(dto);
  }

  @Delete('bulk')
  async bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.smsService.bulkDelete(dto.ids);
  }

  @Patch(':id/cancel')
  async cancelScheduledSms(@Param('id', ParseUUIDPipe) id: string) {
    return await this.smsService.cancelScheduledSms(id);
  }
  @Patch(':id/sendschedule')
  async sendScheduled(@Param('id', ParseUUIDPipe) id: string) {
    return await this.smsService.sendScheduled(id);
  }
}
