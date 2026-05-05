import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User } from '@common/decorators/user.decorator';
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
  list(@User() user: CurrentUser) {
    return this.missionsService.list(user?.id);
  }

  @Post('claim/:missionId')
  @NoCache()
  claim(@User() user: CurrentUser, @Param('missionId') missionId: string) {
    return this.missionsService.claim(user?.id, missionId);
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
