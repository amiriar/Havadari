import { User } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { SendGiftDto } from './dto/send-gift.dto';
import { SocialService } from './social.service';

@ApiTags('social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('friends/request')
  sendFriendRequest(
    @UserDecorator() user: User,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(user, dto);
  }

  @Post('friends/accept/:requestId')
  acceptFriendRequest(
    @UserDecorator() user: User,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptFriendRequest(user, requestId);
  }

  @Post('friends/reject/:requestId')
  rejectFriendRequest(
    @UserDecorator() user: User,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.rejectFriendRequest(user, requestId);
  }

  @Delete('friends/:friendUserId')
  removeFriend(
    @UserDecorator() user: User,
    @Param('friendUserId') friendUserId: string,
  ) {
    return this.socialService.removeFriend(user, friendUserId);
  }

  @Get('friends')
  @NoCache()
  listFriends(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.listFriends(
      user,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('friends/requests/incoming')
  @NoCache()
  incomingRequests(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.listIncomingRequests(
      user,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Post('gifts/send')
  sendGift(@UserDecorator() user: User, @Body() dto: SendGiftDto) {
    return this.socialService.sendGift(user, dto);
  }

  @Post('gifts/claim/:giftId')
  @NoCache()
  claimGift(@UserDecorator() user: User, @Param('giftId') giftId: string) {
    return this.socialService.claimGift(user, giftId);
  }

  @Get('gifts/inbox')
  @NoCache()
  myGifts(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.myGifts(
      user,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
