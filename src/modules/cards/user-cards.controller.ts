import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetUserCardsQueryDto } from './dto/get-user-cards-query.dto';
import { MergeUserCardsDto } from './dto/merge-user-cards.dto';
import { UserCardService } from './services/user-card.service';

@ApiTags('user-cards')
@Controller('user/cards')
export class UserCardsController {
  constructor(private readonly userCardService: UserCardService) {}

  @Post('starter-pack')
  @NoCache()
  grantStarterPack(@User() user: CurrentUser, @Query('count') count?: string) {
    const parsed = count ? Number(count) : 5;
    return this.userCardService.grantStarterPack(
      user.id,
      Number.isFinite(parsed) ? parsed : 5,
    );
  }

  @Get()
  @NoCache()
  listMine(
    @User() user: CurrentUser,
    @Query() query: GetUserCardsQueryDto,
    @Url() url: string,
  ) {
    return this.userCardService.listMine(
      user.id,
      query.page ?? 1,
      query.limit ?? 50,
      url,
    );
  }

  @Post('upgrade/:userCardId')
  @NoCache()
  upgrade(@User() user: CurrentUser, @Param('userCardId') userCardId: string) {
    return this.userCardService.upgrade(user.id, userCardId);
  }

  @Post('merge')
  @NoCache()
  merge(@User() user: CurrentUser, @Body() dto: MergeUserCardsDto) {
    return this.userCardService.mergeDuplicatesToFgc(user.id, dto.userCardIds);
  }
}
