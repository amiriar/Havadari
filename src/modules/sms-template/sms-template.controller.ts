import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateSmsTemplateDto } from './dto/create-sms-template.dto';
import { UpdateSmsTemplateDto } from './dto/update-sms-template.dto';
import { SmsTemplateEntity } from './entities/sms-template.entity';
import { SmsTemplateService } from './sms-template.service';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import {
  CREATE_SMS_TEMPLATE,
  DELETE_SMS_TEMPLATE,
  READ_SMS_TEMPLATE,
  UPDATE_SMS_TEMPLATE,
} from '@common/constants/permissions_name/sms-template';

@Controller('sms-template')
export class SmsTemplateController {
  constructor(private readonly service: SmsTemplateService) {}

  @Post()
  @AuthorizeByPermissions([CREATE_SMS_TEMPLATE])
  async create(
    @Body() createSmsTemplateDto: CreateSmsTemplateDto,
  ): Promise<SmsTemplateEntity> {
    return this.service.create(createSmsTemplateDto);
  }

  @Get()
  @AuthorizeByPermissions([READ_SMS_TEMPLATE])
  async findAll(): Promise<SmsTemplateEntity[]> {
    return this.service.findAll();
  }
  @Get(':id')
  @AuthorizeByPermissions([READ_SMS_TEMPLATE])
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @AuthorizeByPermissions([UPDATE_SMS_TEMPLATE], SmsTemplateEntity)
  update(
    @Param('id') id: string,
    @Body() updateSmsTemplateDto: UpdateSmsTemplateDto,
  ) {
    return this.service.update(id, updateSmsTemplateDto);
  }

  @Delete(':id')
  @AuthorizeByPermissions([DELETE_SMS_TEMPLATE], SmsTemplateEntity)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
