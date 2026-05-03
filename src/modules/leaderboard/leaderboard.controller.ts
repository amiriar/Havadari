import { User } from '@app/auth/entities/user.entity';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardTypeEnum } from './constants/leaderboard.enums';
import { GetLeaderboardQueryDto } from './dto/get-leaderboard-query.dto';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  list(@Query() query: GetLeaderboardQueryDto, @Url() url: string) {
    return this.leaderboardService.getLeaderboard(
      query.type ?? LeaderboardTypeEnum.CLASSIC,
      query.page ?? 1,
      query.limit ?? 20,
      url,
    );
  }

  @Get('me')
  myRank(
    @UserDecorator() user: User,
    @Query('type') type?: LeaderboardTypeEnum,
  ) {
    return this.leaderboardService.getMyRank(
      user,
      type ?? LeaderboardTypeEnum.CLASSIC,
    );
  }
}
