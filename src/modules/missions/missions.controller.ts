import { User } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MissionMetricEnum } from './constants/mission.enums';
import { MissionsService } from './missions.service';

@ApiTags('missions')
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @NoCache()
  list(@UserDecorator() user: User) {
    return this.missionsService.list(user);
  }

  @Post('claim/:missionId')
  @NoCache()
  claim(@UserDecorator() user: User, @Param('missionId') missionId: string) {
    return this.missionsService.claim(user, missionId);
  }

  @Post('track')
  track(
    @Body('userId') userId: string,
    @Body('metric') metric: MissionMetricEnum,
    @Body('value') value?: number,
  ) {
    return this.missionsService.track(userId, metric, value ?? 1);
  }
}
