import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { READ_USER } from '@common/constants/permissions_name/user';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardTypeEnum } from './constants/leaderboard.enums';
import { GetLeaderboardQueryDto } from './dto/get-leaderboard-query.dto';
import { LeaderboardService } from './leaderboard.service';
import { RankPointsService } from './rank-points.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly rankPointsService: RankPointsService,
  ) {}

  @Get()
  @NoCache()
  list(@Query() query: GetLeaderboardQueryDto, @Url() url: string) {
    return this.leaderboardService.getLeaderboard(
      query.type ?? LeaderboardTypeEnum.CLASSIC,
      query.page ?? 1,
      query.limit ?? 20,
      url,
    );
  }

  @Get('me')
  @NoCache()
  myRank(@User() user: CurrentUser, @Query('type') type?: LeaderboardTypeEnum) {
    return this.leaderboardService.getMyRank(
      user.id,
      type ?? LeaderboardTypeEnum.CLASSIC,
    );
  }

  @Get('points-history')
  @NoCache()
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

  @Get('my-points-history')
  @NoCache()
  myPointsHistory(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.rankPointsService.history(
      user.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
