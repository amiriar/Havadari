import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetMarketListingsQueryDto } from './dto/get-market-listings-query.dto';
import { MarketService } from './market.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/market')
export class AdminMarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('listings')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list market listings (all statuses)' })
  @AuthorizeByPermissions([READ_USER])
  listings(@Query() query: GetMarketListingsQueryDto, @Url() url?: string) {
    return this.marketService.adminListings(query, url);
  }

  @Get('trades')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list market trades' })
  @AuthorizeByPermissions([READ_USER])
  trades(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.marketService.adminTrades(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('users/:userId/listings')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list market listings by user' })
  @AuthorizeByPermissions([READ_USER])
  userListings(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.marketService.adminUserListings(
      userId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Patch('listings/:listingId/force-cancel')
  @ApiOperation({ summary: 'Admin: force cancel active listing' })
  @AuthorizeByPermissions([UPDATE_USER])
  forceCancel(@Param('listingId') listingId: string) {
    return this.marketService.adminForceCancel(listingId);
  }

  @Post('expire/run')
  @ApiOperation({ summary: 'Admin: run listing expiration job now' })
  @AuthorizeByPermissions([UPDATE_USER])
  runExpire() {
    return this.marketService.expireOldListings();
  }
}

