import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChestsService } from './chests.service';

@ApiTags('game-chests')
@Controller()
export class ChestsController {
  constructor(private readonly service: ChestsService) {}

  @Get('shop/chests')
  getChests() {
    return this.service.getChests();
  }

  @Post('chest/open/:chestType')
  openChest(@User() user: AuthUser, @Param('chestType') chestType: string) {
    return this.service.openChest(user, chestType);
  }

  @Post('purchase/gems')
  purchaseGems(@User() user: AuthUser, @Body('gems') gems: number) {
    return this.service.purchaseGems(user, gems);
  }

  @Get('purchase/history')
  purchaseHistory(@User() user: AuthUser) {
    return this.service.getPurchaseHistory(user);
  }
}
