import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@app/auth/entities/user.entity';
import { GetUserCardsQueryDto } from './dto/get-user-cards-query.dto';
import { MergeUserCardsDto } from './dto/merge-user-cards.dto';
import { UserCardService } from './services/user-card.service';

@ApiTags('user-cards')
@Controller('user/cards')
export class UserCardsController {
  constructor(private readonly userCardService: UserCardService) {}

  @Post('starter-pack')
  grantStarterPack(
    @UserDecorator() user: User,
    @Query('count') count?: string,
  ) {
    const parsed = count ? Number(count) : 5;
    return this.userCardService.grantStarterPack(
      user,
      Number.isFinite(parsed) ? parsed : 5,
    );
  }

  @Get()
  listMine(
    @UserDecorator() user: User,
    @Query() query: GetUserCardsQueryDto,
    @Url() url: string,
  ) {
    return this.userCardService.listMine(
      user,
      query.page ?? 1,
      query.limit ?? 50,
      url,
    );
  }

  @Post('upgrade/:userCardId')
  upgrade(
    @UserDecorator() user: User,
    @Param('userCardId') userCardId: string,
  ) {
    return this.userCardService.upgrade(user, userCardId);
  }

  @Post('merge')
  merge(@UserDecorator() user: User, @Body() dto: MergeUserCardsDto) {
    return this.userCardService.mergeDuplicatesToFgc(user, dto.userCardIds);
  }
}
