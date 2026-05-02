import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UpdateProfileDto } from '../dto';
import { ProfileService } from './profile.service';

@ApiTags('game-profile')
@Controller('user')
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('profile')
  getProfile(@User() user: AuthUser) {
    return this.service.getProfile(user);
  }

  @Put('profile')
  updateProfile(@User() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user, dto);
  }

  @Get('stats')
  getStats(@User() user: AuthUser) {
    return this.service.getStats(user);
  }
}
