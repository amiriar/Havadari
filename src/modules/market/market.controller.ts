import { User as CurrentUser } from '@app/auth/entities/user.entity';
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
import { ListingTypeEnum } from './constants/market.types';
import { CreateAuctionListingDto } from './dto/create-auction-listing.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { GetMarketListingsQueryDto } from './dto/get-market-listings-query.dto';
import { MarketService } from './market.service';
import { NoCache } from '@common/decorators/no-cache';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('list')
  list(@User() user: CurrentUser, @Body() dto: CreateListingDto) {
    return this.marketService.list(user.id, dto);
  }

  @Post('buy/:listingId')
  buy(@User() user: CurrentUser, @Param('listingId') listingId: string) {
    return this.marketService.buy(user.id, listingId);
  }

  @Post('auction/list')
  listAuction(@User() user: CurrentUser, @Body() dto: CreateAuctionListingDto) {
    return this.marketService.listAuction(user.id, dto);
  }

  @Post('auction/bid/:listingId')
  bidAuction(
    @User() user: CurrentUser,
    @Param('listingId') listingId: string,
    @Body('amount') amount: number,
  ) {
    return this.marketService.bidAuction(user.id, listingId, Number(amount));
  }

  @Get('listings')
  listings(@Query() query: GetMarketListingsQueryDto, @Url() url: string) {
    return this.marketService.listings(query, url);
  }

  @Get('auction/listings')
  auctionListings(
    @Query() query: GetMarketListingsQueryDto,
    @Url() url: string,
  ) {
    return this.marketService.listings(
      { ...query, type: ListingTypeEnum.AUCTION },
      url,
    );
  }

  @Get('my-listings')
  @NoCache()
  myListings(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.marketService.myListings(
      user.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Delete('listing/:listingId')
  cancel(@User() user: CurrentUser, @Param('listingId') listingId: string) {
    return this.marketService.cancel(user.id, listingId);
  }
}
