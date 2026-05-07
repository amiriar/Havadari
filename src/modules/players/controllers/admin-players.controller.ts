import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  UPDATE_USER,
} from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetPlayersQueryDto } from '../dto/get-players-query.dto';
import { ManualImportPlayersDto } from '../dto/manual-import.dto';
import { SyncPlayersQueryDto } from '../dto/sync-players-query.dto';
import { PlayersService } from '../players.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/players')
export class AdminPlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post('sync')
  @NoCache()
  @ApiOperation({ summary: 'Admin: sync players from providers' })
  @AuthorizeByPermissions([UPDATE_USER])
  sync(@Query() query: SyncPlayersQueryDto) {
    const competitionList = query.competitions
      ? query.competitions
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : undefined;
    return this.playersService.syncNow(query.season ?? 2026, competitionList);
  }

  @Post('import/manual')
  @ApiOperation({ summary: 'Admin: manual import players + stats' })
  @AuthorizeByPermissions([CREATE_USER])
  importManual(@Body() dto: ManualImportPlayersDto) {
    return this.playersService.importManual(dto);
  }

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: list players' })
  @AuthorizeByPermissions([READ_USER])
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

  @Get(':id')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get player by id' })
  @AuthorizeByPermissions([READ_USER])
  getById(@Param('id') id: string) {
    return this.playersService.adminGetById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update player' })
  @AuthorizeByPermissions([UPDATE_USER])
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.playersService.adminUpdatePlayer(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: delete player' })
  @AuthorizeByPermissions([DELETE_USER])
  delete(@Param('id') id: string) {
    return this.playersService.adminDeletePlayer(id);
  }

  @Get(':id/stats')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get player stats snapshots' })
  @AuthorizeByPermissions([READ_USER])
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

  @Get('sync/history')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get players sync run history' })
  @AuthorizeByPermissions([READ_USER])
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

