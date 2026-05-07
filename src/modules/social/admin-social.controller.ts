import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SocialService } from './social.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/social')
export class AdminSocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friendships')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list friendships' })
  @AuthorizeByPermissions([READ_USER])
  friendships(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.adminFriendships(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('friend-requests')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list friend requests' })
  @AuthorizeByPermissions([READ_USER])
  friendRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.adminFriendRequests(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('gifts')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list gifts' })
  @AuthorizeByPermissions([READ_USER])
  gifts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.socialService.adminGifts(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Delete('friendships/:friendshipId')
  @ApiOperation({ summary: 'Admin: delete friendship' })
  @AuthorizeByPermissions([UPDATE_USER])
  deleteFriendship(@Param('friendshipId') friendshipId: string) {
    return this.socialService.adminDeleteFriendship(friendshipId);
  }

  @Patch('friend-requests/:requestId/reject')
  @ApiOperation({ summary: 'Admin: reject pending friend request' })
  @AuthorizeByPermissions([UPDATE_USER])
  rejectRequest(@Param('requestId') requestId: string) {
    return this.socialService.adminRejectRequest(requestId);
  }

  @Patch('gifts/:giftId/cancel')
  @ApiOperation({ summary: 'Admin: cancel non-claimed gift' })
  @AuthorizeByPermissions([UPDATE_USER])
  cancelGift(@Param('giftId') giftId: string) {
    return this.socialService.adminCancelGift(giftId);
  }
}

