import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { BattleHistoryQueryDto } from './dto/battle-history-query.dto';
import { EndBattleDto } from './dto/end-battle.dto';
import { FindMatchDto } from './dto/find-match.dto';
import { PlayRoundDto } from './dto/play-round.dto';
import { StartBattleDto } from './dto/start-battle.dto';

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
}
