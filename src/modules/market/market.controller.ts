import { User } from '@app/auth/entities/user.entity';
import { User as UserDecorator } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateListingDto } from './dto/create-listing.dto';
import { GetMarketListingsQueryDto } from './dto/get-market-listings-query.dto';
import { MarketService } from './market.service';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Post('list')
  list(@UserDecorator() user: User, @Body() dto: CreateListingDto) {
    return this.marketService.list(user, dto);
  }

  @Post('buy/:listingId')
  buy(@UserDecorator() user: User, @Param('listingId') listingId: string) {
    return this.marketService.buy(user, listingId);
  }

  @Get('listings')
  listings(@Query() query: GetMarketListingsQueryDto, @Url() url: string) {
    return this.marketService.listings(query, url);
  }

  @Get('my-listings')
  myListings(
    @UserDecorator() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.marketService.myListings(
      user,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Delete('listing/:listingId')
  cancel(@UserDecorator() user: User, @Param('listingId') listingId: string) {
    return this.marketService.cancel(user, listingId);
  }
}

