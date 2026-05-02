import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('game-leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly service: LeaderboardService) {}

  @Get(':type')
  list(@Param('type') type: string, @Query('region') region?: string) {
    return this.service.getLeaderboard(type, region);
  }
}
