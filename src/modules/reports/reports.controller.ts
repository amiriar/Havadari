import { UploadImageConfig } from '@app/file/configs/upload-image.config';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          example: 'There is a bug in battle matching.',
        },
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }], new UploadImageConfig()),
  )
  async create(
    @User() user: { id: string },
    @Body() dto: CreateReportDto,
    @UploadedFiles() files: { photo?: Express.Multer.File[] },
  ) {
    return this.reportsService.create(user?.id, dto, files?.photo?.[0]);
  }
}
