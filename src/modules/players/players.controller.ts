import { IsPublic } from '@common/decorators/is-public.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { ManualImportPlayersDto } from './dto/manual-import.dto';
import { SeedPlayersDto } from './dto/seed-players.dto';
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
    return this.playersService.syncNow(query.season ?? 2026, competitionList);
  }

  @IsPublic()
  @Post('import/manual')
  importManual(@Body() dto: ManualImportPlayersDto) {
    return this.playersService.importManual(dto);
  }

  @IsPublic()
  @Post('seed/basic')
  seedBasic(@Query() query: SeedPlayersDto) {
    return this.playersService.seedBasic(query.season ?? 2026);
  }

  @IsPublic()
  @Get()
  list(@Query() query: GetPlayersQueryDto, @Url() url: string) {
    return this.playersService.list({
      team: query.team,
      position: query.position,
      competitionCode: query.competitionCode,
      q: query.q,
      limit: query.limit ?? 100,
      page: query.page ?? 1,
      url,
    });
  }

  @IsPublic()
  @Get(':id/stats')
  stats(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.playersService.stats(
      id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @IsPublic()
  @Get('sync/history')
  syncHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.playersService.syncHistory(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
