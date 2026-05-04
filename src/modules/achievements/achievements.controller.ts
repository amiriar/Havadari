import { User } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @NoCache()
  list(@UserDecorator() user: User) {
    return this.achievementsService.list(user);
  }

  @Post('claim/:achievementId')
  @NoCache()
  claim(
    @UserDecorator() user: User,
    @Param('achievementId') achievementId: string,
  ) {
    return this.achievementsService.claim(user, achievementId);
  }
}
