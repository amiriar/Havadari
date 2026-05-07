import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { AdminUpsertAchievementDto } from './dto/admin-upsert-achievement.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/achievements')
export class AdminAchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('definitions')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list achievement definitions' })
  @AuthorizeByPermissions([READ_USER])
  definitions() {
    return this.achievementsService.adminListDefinitions();
  }

  @Post('definitions')
  @ApiOperation({ summary: 'Admin: upsert achievement definition by code' })
  @AuthorizeByPermissions([UPDATE_USER])
  upsertDefinition(@Body() dto: AdminUpsertAchievementDto) {
    return this.achievementsService.adminUpsertDefinition(dto);
  }

  @Delete('definitions/:id')
  @ApiOperation({ summary: 'Admin: delete achievement definition' })
  @AuthorizeByPermissions([UPDATE_USER])
  deleteDefinition(@Param('id') id: string) {
    return this.achievementsService.adminDeleteDefinition(id);
  }

  @Get('progress')
  @NoCache()
  @ApiOperation({ summary: 'Admin: user achievement progress list' })
  @AuthorizeByPermissions([READ_USER])
  progress(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.achievementsService.adminProgress(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      userId,
      url,
    );
  }

  @Get('claim-logs')
  @NoCache()
  @ApiOperation({ summary: 'Admin: achievement claim logs' })
  @AuthorizeByPermissions([READ_USER])
  claimLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.achievementsService.adminClaimLogs(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      userId,
      url,
    );
  }
}

