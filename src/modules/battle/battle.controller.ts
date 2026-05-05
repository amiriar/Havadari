import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { BattleHistoryQueryDto } from './dto/battle-history-query.dto';
import { EndBattleDto } from './dto/end-battle.dto';
import { FindMatchDto } from './dto/find-match.dto';
import { PlayRoundDto } from './dto/play-round.dto';
import { RankedSeasonRewardDto } from './dto/ranked-season-reward.dto';
import { ResolveTournamentMatchDto } from './dto/resolve-tournament-match.dto';
import { StartBattleDto } from './dto/start-battle.dto';
import { TournamentEntryDto } from './dto/tournament-entry.dto';

@ApiTags('battle')
@ApiBearerAuth()
@Controller('battle')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @Post('find-match')
  @NoCache()
  @ApiOperation({ summary: 'Find pvp match or prepare bot fallback' })
  findMatch(@User() user: CurrentUser, @Body() dto: FindMatchDto) {
    return this.battleService.findMatch(user.id, dto);
  }

  @Post('start')
  @NoCache()
  @ApiOperation({ summary: 'Start a battle' })
  start(@User() user: CurrentUser, @Body() dto: StartBattleDto) {
    return this.battleService.start(user.id, dto);
  }

  @Post('play-round')
  @NoCache()
  @ApiOperation({ summary: 'Play next round of a battle' })
  playRound(@User() user: CurrentUser, @Body() dto: PlayRoundDto) {
    return this.battleService.playRound(user.id, dto.battleId);
  }

  @Post('end')
  @NoCache()
  @ApiOperation({ summary: 'Finalize battle and settle rewards' })
  end(@User() user: CurrentUser, @Body() dto: EndBattleDto) {
    return this.battleService.end(user.id, dto.battleId);
  }

  @Get('history')
  @NoCache()
  @ApiOperation({ summary: 'Get my battle history' })
  history(
    @User() user: CurrentUser,
    @Query() query: BattleHistoryQueryDto,
    @Url() url?: string,
  ) {
    return this.battleService.history(user.id, query, url);
  }

  @Get('ranked/season')
  @NoCache()
  @ApiOperation({ summary: 'Get ranked season meta and tier info' })
  rankedSeason(@User() user: CurrentUser) {
    return this.battleService.rankedSeasonMeta(user.id);
  }

  @Post('ranked/distribute-season-rewards')
  @NoCache()
  @ApiOperation({ summary: 'Mark closed ranked season rewards as distributed' })
  distributeSeasonRewards(@Body() dto: RankedSeasonRewardDto) {
    return this.battleService.distributeSeasonRewards(dto.seasonKey);
  }

  @Post('ranked/claim-season-reward')
  @NoCache()
  @ApiOperation({ summary: 'Claim my ranked season-end reward' })
  claimSeasonReward(
    @User() user: CurrentUser,
    @Body() dto: RankedSeasonRewardDto,
  ) {
    return this.battleService.claimSeasonReward(user.id, dto.seasonKey);
  }

  @Get('tournament/current')
  @NoCache()
  @ApiOperation({ summary: 'Get current champions tournament' })
  tournamentCurrent(@User() user: CurrentUser) {
    return this.battleService.tournamentCurrent(user?.id);
  }

  @Post('tournament/join')
  @NoCache()
  @ApiOperation({ summary: 'Join current champions tournament' })
  tournamentJoin(@User() user: CurrentUser, @Body() dto: TournamentEntryDto) {
    return this.battleService.tournamentJoin(user.id, dto.entryType);
  }

  @Get('tournament/me')
  @NoCache()
  @ApiOperation({ summary: 'Get my current tournament status' })
  tournamentMe(@User() user: CurrentUser) {
    return this.battleService.tournamentMyStatus(user.id);
  }

  @Get('tournament/my-next-match')
  @NoCache()
  @ApiOperation({ summary: 'Get my next pending tournament match' })
  tournamentMyNextMatch(@User() user: CurrentUser) {
    return this.battleService.tournamentMyNextMatch(user.id);
  }

  @Post('tournament/match/start')
  @NoCache()
  @ApiOperation({ summary: 'Start real battle for a pending tournament match' })
  @ApiQuery({ name: 'matchId', type: String, required: true })
  tournamentStartMatch(@User() user: CurrentUser, @Query('matchId') matchId: string) {
    return this.battleService.tournamentStartMatch(user.id, matchId);
  }

  @Get('tournament/fixtures')
  @NoCache()
  @ApiOperation({ summary: 'Get current tournament fixtures (group + knockout)' })
  tournamentFixtures(@User() user: CurrentUser) {
    return this.battleService.tournamentFixtures(user.id);
  }

  @Get('tournament/standings')
  @NoCache()
  @ApiOperation({ summary: 'Get current tournament standings' })
  tournamentStandings(@User() user: CurrentUser) {
    return this.battleService.tournamentStandings(user.id);
  }

  @Post('tournament/match/resolve')
  @NoCache()
  @ApiOperation({ summary: 'Resolve a tournament match (api-only scaffold)' })
  @ApiQuery({ name: 'matchId', type: String, required: true })
  tournamentResolveMatch(
    @User() user: CurrentUser,
    @Query('matchId') matchId: string,
    @Body() dto: ResolveTournamentMatchDto,
  ) {
    return this.battleService.tournamentResolveMatch(user?.id, matchId, dto);
  }

  @Post('tournament/settle-demo')
  @NoCache()
  @ApiOperation({ summary: 'Settle tournament demo (api-only scaffold)' })
  tournamentSettleDemo(@Body() dto: RankedSeasonRewardDto) {
    return this.battleService.tournamentSettleDemo(dto.seasonKey);
  }
}
