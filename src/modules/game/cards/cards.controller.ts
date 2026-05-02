import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CardsService } from './cards.service';

@ApiTags('game-cards')
@Controller('user')
export class CardsController {
  constructor(private readonly service: CardsService) {}

  @Get('cards')
  getCards(@User() user: AuthUser) {
    return this.service.getUserCards(user);
  }
}
