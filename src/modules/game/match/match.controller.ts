import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatchService } from './match.service';

@ApiTags('game-match')
@Controller('match')
export class MatchController {
  constructor(private readonly service: MatchService) {}

  @Get('upcoming')
  upcoming(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 25;
    return this.service.getUpcoming(Number.isFinite(parsed) ? parsed : 25);
  }

  @Post('sync-now')
  syncNow(@Query('season') season?: string) {
    const parsedSeason = season ? Number(season) : 2026;
    return this.service.syncNow(
      Number.isFinite(parsedSeason) ? parsedSeason : 2026,
    );
  }

  @Get('sync-history')
  syncHistory(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 20;
    return this.service.getLatestSyncRuns(
      Number.isFinite(parsed) ? parsed : 20,
    );
  }
}
