import { User } from '@app/auth/entities/user.entity';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChestsService } from './chests.service';

@ApiTags('chests')
@Controller('chests')
export class ChestsController {
  constructor(private readonly chestsService: ChestsService) {}

  @Get()
  list() {
    return this.chestsService.listDefinitions();
  }

  @Get('state')
  state(@UserDecorator() user: User) {
    return this.chestsService.getState(user);
  }

  @Post('open/:type')
  open(@UserDecorator() user: User, @Param('type') type: string) {
    return this.chestsService.open(user, type as any);
  }

  @Get('logs')
  logs(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.chestsService.logs(
      user,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}

