import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminUpsertMissionDto } from './dto/admin-upsert-mission.dto';
import { MissionsService } from './missions.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/missions')
export class AdminMissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get('definitions')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list mission definitions' })
  @AuthorizeByPermissions([READ_USER])
  definitions() {
    return this.missionsService.adminListDefinitions();
  }

  @Post('definitions')
  @ApiOperation({ summary: 'Admin: upsert mission definition by code' })
  @AuthorizeByPermissions([UPDATE_USER])
  upsertDefinition(@Body() dto: AdminUpsertMissionDto) {
    return this.missionsService.adminUpsertDefinition(dto);
  }

  @Delete('definitions/:id')
  @ApiOperation({ summary: 'Admin: delete mission definition' })
  @AuthorizeByPermissions([UPDATE_USER])
  deleteDefinition(@Param('id') id: string) {
    return this.missionsService.adminDeleteDefinition(id);
  }

  @Get('progress')
  @NoCache()
  @ApiOperation({ summary: 'Admin: user mission progress list' })
  @AuthorizeByPermissions([READ_USER])
  progress(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.missionsService.adminProgress(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      userId,
      url,
    );
  }

  @Get('claim-logs')
  @NoCache()
  @ApiOperation({ summary: 'Admin: mission claim logs' })
  @AuthorizeByPermissions([READ_USER])
  claimLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.missionsService.adminClaimLogs(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      userId,
      url,
    );
  }

  @Post('maintenance/cleanup-daily')
  @ApiOperation({ summary: 'Admin: run daily progress cleanup now' })
  @AuthorizeByPermissions([UPDATE_USER])
  cleanupDaily() {
    return this.missionsService.cleanupDailyProgress();
  }

  @Post('maintenance/cleanup-weekly')
  @ApiOperation({ summary: 'Admin: run weekly progress cleanup now' })
  @AuthorizeByPermissions([UPDATE_USER])
  cleanupWeekly() {
    return this.missionsService.cleanupWeeklyProgress();
  }
}

