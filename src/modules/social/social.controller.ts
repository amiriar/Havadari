import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User } from '@common/decorators/user.decorator';
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
    @User() user: CurrentUser,
    @Body() dto: SendFriendRequestDto,
  ) {
    return this.socialService.sendFriendRequest(user?.id, dto);
  }

  @Post('friends/accept/:requestId')
  acceptFriendRequest(
    @User() user: CurrentUser,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.acceptFriendRequest(user?.id, requestId);
  }

  @Post('friends/reject/:requestId')
  rejectFriendRequest(
    @User() user: CurrentUser,
    @Param('requestId') requestId: string,
  ) {
    return this.socialService.rejectFriendRequest(user?.id, requestId);
  }

  @Delete('friends/:friendUserId')
  removeFriend(
    @User() user: CurrentUser,
    @Param('friendUserId') friendUserId: string,
  ) {
    return this.socialService.removeFriend(user?.id, friendUserId);
  }

  @Get('friends')
  @NoCache()
  listFriends(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.listFriends(
      user?.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('friends/requests/incoming')
  @NoCache()
  incomingRequests(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.listIncomingRequests(
      user?.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Post('gifts/send')
  sendGift(@User() user: CurrentUser, @Body() dto: SendGiftDto) {
    return this.socialService.sendGift(user?.id, dto);
  }

  @Post('gifts/claim/:giftId')
  @NoCache()
  claimGift(@User() user: CurrentUser, @Param('giftId') giftId: string) {
    return this.socialService.claimGift(user?.id, giftId);
  }

  @Get('gifts/inbox')
  @NoCache()
  myGifts(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.myGifts(
      user?.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
