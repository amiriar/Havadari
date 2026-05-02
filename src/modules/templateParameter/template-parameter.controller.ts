import { Controller, Get } from '@nestjs/common';
import { TemplateParameterEntity } from './entities/template-parameter.entity';
import { TemplateParameterService } from './template-parameter.service';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { READ_TEMPLATE_PARAMETER } from '@common/constants/permissions_name/template-parameter';

@Controller('template-parameter')
export class TemplateParameterController {
  constructor(private readonly service: TemplateParameterService) {}

  @Get()
  @AuthorizeByPermissions([READ_TEMPLATE_PARAMETER])
  async findAll(): Promise<TemplateParameterEntity[]> {
    return this.service.findAll();
  }
}
