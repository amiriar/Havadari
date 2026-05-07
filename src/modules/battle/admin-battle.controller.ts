import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { BattleHistoryQueryDto } from './dto/battle-history-query.dto';
import { RankedSeasonRewardDto } from './dto/ranked-season-reward.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/battle')
export class AdminBattleController {
  constructor(private readonly battleService: BattleService) {}

  @Get('matches')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list battles' })
  @AuthorizeByPermissions([READ_USER])
  listMatches(
    @Query() query: BattleHistoryQueryDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : query.page ?? 1;
    const parsedLimit = limit ? Number(limit) : query.limit ?? 20;
    return this.battleService.adminListBattles(
      { ...query, page: parsedPage, limit: parsedLimit },
      url,
    );
  }

  @Get('matches/:battleId')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get battle detail by id' })
  @AuthorizeByPermissions([READ_USER])
  getMatch(@Param('battleId') battleId: string) {
    return this.battleService.adminGetBattle(battleId);
  }

  @Post('ranked/distribute-season-rewards')
  @ApiOperation({ summary: 'Admin: distribute ranked season rewards' })
  @AuthorizeByPermissions([UPDATE_USER])
  distributeSeasonRewards(@Body() dto: RankedSeasonRewardDto) {
    return this.battleService.distributeSeasonRewards(dto.seasonKey);
  }

  @Post('tournament/settle')
  @ApiOperation({ summary: 'Admin: settle tournament season' })
  @AuthorizeByPermissions([UPDATE_USER])
  settleTournament(@Body() dto: RankedSeasonRewardDto) {
    return this.battleService.tournamentSettleDemo(dto.seasonKey);
  }

  @Post('tournament/match/resolve')
  @ApiOperation({ summary: 'Admin: force resolve tournament match quickly' })
  @AuthorizeByPermissions([UPDATE_USER])
  @ApiQuery({ name: 'matchId', type: String, required: true })
  forceResolveMatch(@Query('matchId') matchId: string) {
    return this.battleService.adminForceResolveTournamentMatch(matchId);
  }
}
