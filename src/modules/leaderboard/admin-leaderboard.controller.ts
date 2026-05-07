import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaderboardTypeEnum } from './constants/leaderboard.enums';
import { GetLeaderboardQueryDto } from './dto/get-leaderboard-query.dto';
import { LeaderboardService } from './leaderboard.service';
import { RankPointsService } from './rank-points.service';
import { AdminUpsertLeaderboardRewardDto } from './dto/admin-upsert-leaderboard-reward.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/leaderboard')
export class AdminLeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly rankPointsService: RankPointsService,
  ) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: leaderboard listing by type' })
  @AuthorizeByPermissions([READ_USER])
  list(@Query() query: GetLeaderboardQueryDto, @Url() url: string) {
    return this.leaderboardService.getLeaderboard(
      query.type ?? LeaderboardTypeEnum.CLASSIC,
      query.page ?? 1,
      query.limit ?? 20,
      url,
    );
  }

  @Get('rewards')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list leaderboard rewards config' })
  @AuthorizeByPermissions([READ_USER])
  rewards(@Query('type') type?: LeaderboardTypeEnum) {
    return this.leaderboardService.adminListRewards(type);
  }

  @Post('rewards')
  @ApiOperation({ summary: 'Admin: upsert leaderboard reward config row' })
  @AuthorizeByPermissions([UPDATE_USER])
  upsertReward(@Body() dto: AdminUpsertLeaderboardRewardDto) {
    return this.leaderboardService.adminUpsertReward(dto);
  }

  @Delete('rewards/:id')
  @ApiOperation({ summary: 'Admin: delete leaderboard reward config row' })
  @AuthorizeByPermissions([UPDATE_USER])
  deleteReward(@Param('id') id: string) {
    return this.leaderboardService.adminDeleteReward(id);
  }

  @Get('points-history')
  @NoCache()
  @ApiOperation({ summary: 'Admin: rank points events history (all users or specific user)' })
  @AuthorizeByPermissions([READ_USER])
  pointsHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.rankPointsService.history(
      userId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Post('reset/classic-weekly')
  @ApiOperation({ summary: 'Admin: run classic weekly soft reset now' })
  @AuthorizeByPermissions([UPDATE_USER])
  resetClassicWeeklyNow() {
    return this.leaderboardService.resetClassicWeekly();
  }
}

