import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User } from '@common/decorators/user.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @NoCache()
  list(@User() user: CurrentUser) {
    return this.achievementsService.list(user.id);
  }

  @Post('claim/:achievementId')
  @NoCache()
  claim(
    @User() user: CurrentUser,
    @Param('achievementId') achievementId: string,
  ) {
    return this.achievementsService.claim(user.id, achievementId);
  }
}
