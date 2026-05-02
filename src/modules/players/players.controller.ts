import { IsPublic } from '@common/decorators/is-public.decorator';
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { SyncPlayersQueryDto } from './dto/sync-players-query.dto';
import { PlayersService } from './players.service';

@ApiTags('players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @IsPublic()
  @Post('sync')
  sync(@Query() query: SyncPlayersQueryDto) {
    const competitionList = query.competitions
      ? query.competitions
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;
    return this.playersService.syncNow(
      query.season ?? 2026,
      competitionList,
    );
  }

  @IsPublic()
  @Get()
  list(@Query() query: GetPlayersQueryDto) {
    return this.playersService.list({
      team: query.team,
      position: query.position,
      competitionCode: query.competitionCode,
      q: query.q,
      limit: query.limit ?? 500,
    });
  }

  @IsPublic()
  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.playersService.stats(id);
  }

  @IsPublic()
  @Get('sync/history')
  syncHistory(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.playersService.syncHistory(
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }
}
