import { READ_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: list reports' })
  @AuthorizeByPermissions([READ_USER])
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.reportsService.adminList(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get(':id')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get report details' })
  @AuthorizeByPermissions([READ_USER])
  details(@Param('id') id: string) {
    return this.reportsService.adminGetById(id);
  }
}

