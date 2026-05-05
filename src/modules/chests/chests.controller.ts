import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChestTypeEnum } from './constants/chest.types';
import { ChestsService } from './chests.service';
import { OpenChestDto } from './dto/open-chest.dto';

@ApiTags('chests')
@Controller('chests')
export class ChestsController {
  constructor(private readonly chestsService: ChestsService) {}

  @Get()
  list() {
    return this.chestsService.listDefinitions();
  }

  @Get('state')
  @NoCache()
  state(@User() user: CurrentUser) {
    return this.chestsService.getState(user?.id);
  }

  @Post('open')
  @NoCache()
  @ApiOperation({ summary: 'Open a chest' })
  @ApiQuery({ name: 'type', enum: ChestTypeEnum, required: true })
  open(@User() user: CurrentUser, @Query() dto: OpenChestDto) {
    return this.chestsService.open(user?.id, dto.type);
  }

  @Get('logs')
  @NoCache()
  logs(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.chestsService.logs(
      user?.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
