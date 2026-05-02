import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EndBattleDto, PlayRoundDto, StartBattleDto } from '../dto';
import { BattleService } from './battle.service';

@ApiTags('game-battle')
@Controller('battle')
export class BattleController {
  constructor(private readonly service: BattleService) {}

  @Post('find-match')
  findMatch(@User() user: AuthUser) {
    return this.service.findMatch(user);
  }

  @Post('start')
  start(@User() user: AuthUser, @Body() dto: StartBattleDto) {
    return this.service.startBattle(user, dto);
  }

  @Post('play-round')
  playRound(@User() user: AuthUser, @Body() dto: PlayRoundDto) {
    return this.service.playRound(user, dto);
  }

  @Post('end')
  end(@User() user: AuthUser, @Body() dto: EndBattleDto) {
    return this.service.endBattle(user, dto);
  }

  @Get('history')
  history(@User() user: AuthUser) {
    return this.service.history(user);
  }
}
