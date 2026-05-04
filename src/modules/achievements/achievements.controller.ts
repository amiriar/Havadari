import { User } from '@app/auth/entities/user.entity';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  list(@UserDecorator() user: User) {
    return this.achievementsService.list(user);
  }

  @Post('claim/:achievementId')
  claim(
    @UserDecorator() user: User,
    @Param('achievementId') achievementId: string,
  ) {
    return this.achievementsService.claim(user, achievementId);
  }
}
