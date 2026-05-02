import { User as AuthUser } from '@app/auth/entities/user.entity';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlacePredictionDto } from '../dto';
import { PredictionService } from './prediction.service';

@ApiTags('game-prediction')
@Controller('prediction')
export class PredictionController {
  constructor(private readonly service: PredictionService) {}

  @Get('matches')
  matches() {
    return this.service.getMatches();
  }

  @Post('place')
  place(@User() user: AuthUser, @Body() dto: PlacePredictionDto) {
    return this.service.place(user, dto);
  }

  @Get('my-predictions')
  mine(@User() user: AuthUser) {
    return this.service.myPredictions(user);
  }
}
