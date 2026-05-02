import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListCardDto, PlaceBidDto } from '../dto';
import { MarketService } from './market.service';

@ApiTags('game-market')
@Controller('market')
export class MarketController {
  constructor(private readonly service: MarketService) {}

  @Get('listings')
  listings() {
    return this.service.listings();
  }

  @Post('list')
  list(@User() user: AuthUser, @Body() dto: ListCardDto) {
    return this.service.list(user, dto);
  }

  @Post('buy/:listingId')
  buy(@User() user: AuthUser, @Param('listingId') listingId: string) {
    return this.service.buy(user, listingId);
  }

  @Post('bid/:listingId')
  bid(
    @User() user: AuthUser,
    @Param('listingId') listingId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.service.bid(user, listingId, dto);
  }

  @Delete('listing/:listingId')
  cancel(@User() user: AuthUser, @Param('listingId') listingId: string) {
    return this.service.cancel(user, listingId);
  }
}
