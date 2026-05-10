import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PredictionMatchStatusEnum } from './constants/prediction.enums';
import { AdminImportWorldcupMatchesDto } from './dto/admin-import-worldcup-matches.dto';
import { AdminSetPredictionResultDto } from './dto/admin-set-prediction-result.dto';
import { AdminUpsertPredictionMatchDto } from './dto/admin-upsert-prediction-match.dto';
import { AdminUpsertPredictionOptionDto } from './dto/admin-upsert-prediction-option.dto';
import { PredictionService } from './prediction.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/prediction')
export class AdminPredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get('matches')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list prediction matches' })
  @AuthorizeByPermissions([READ_USER])
  matches(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.predictionService.adminMatches(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Post('matches')
  @ApiOperation({ summary: 'Admin: upsert prediction match by externalMatchId' })
  @AuthorizeByPermissions([UPDATE_USER])
  upsertMatch(@Body() dto: AdminUpsertPredictionMatchDto) {
    return this.predictionService.adminUpsertMatch(dto);
  }

  @Post('matches/import/worldcup')
  @ApiOperation({ summary: 'Admin: import world cup matches from openfootball' })
  @AuthorizeByPermissions([UPDATE_USER])
  importWorldcup(@Body() dto: AdminImportWorldcupMatchesDto) {
    return this.predictionService.adminImportWorldcupMatches(dto);
  }

  @Patch('matches/:matchId/status')
  @ApiOperation({ summary: 'Admin: set prediction match status' })
  @AuthorizeByPermissions([UPDATE_USER])
  setMatchStatus(
    @Param('matchId') matchId: string,
    @Body('status') status: PredictionMatchStatusEnum,
  ) {
    return this.predictionService.adminSetMatchStatus(matchId, status);
  }

  @Post('options')
  @ApiOperation({ summary: 'Admin: upsert prediction option' })
  @AuthorizeByPermissions([UPDATE_USER])
  upsertOption(@Body() dto: AdminUpsertPredictionOptionDto) {
    return this.predictionService.adminUpsertOption(dto);
  }

  @Post('result')
  @ApiOperation({ summary: 'Admin: set final result option' })
  @AuthorizeByPermissions([UPDATE_USER])
  setResult(@Body() dto: AdminSetPredictionResultDto) {
    return this.predictionService.adminSetResult(dto);
  }

  @Post('settle/:matchId')
  @ApiOperation({ summary: 'Admin: settle prediction match' })
  @AuthorizeByPermissions([UPDATE_USER])
  settle(@Param('matchId') matchId: string) {
    return this.predictionService.adminSettleMatch(matchId);
  }

  @Get('bets')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list prediction bets' })
  @AuthorizeByPermissions([READ_USER])
  bets(
    @Query('matchId') matchId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.predictionService.adminBets(
      matchId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
