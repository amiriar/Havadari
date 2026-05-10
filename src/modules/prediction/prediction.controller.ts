import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { User } from '@common/decorators/user.decorator';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetPredictionMatchesQueryDto } from './dto/get-prediction-matches-query.dto';
import { PlacePredictionDto } from './dto/place-prediction.dto';
import { PredictionService } from './prediction.service';

@ApiTags('prediction')
@Controller('prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get('matches')
  @NoCache()
  matches(@Query() query: GetPredictionMatchesQueryDto, @Url() url?: string) {
    return this.predictionService.listMatches(query, url);
  }

  @Get('matches/:id/options')
  @NoCache()
  options(@Param('id') id: string) {
    return this.predictionService.getMatchOptions(id);
  }

  @Post('place')
  place(@User() user: CurrentUser, @Body() dto: PlacePredictionDto) {
    return this.predictionService.place(user.id, dto);
  }

  @Get('my-predictions')
  @NoCache()
  myPredictions(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.predictionService.myPredictions(
      user.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}

