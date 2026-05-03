import { IsPublic } from '@common/decorators/is-public.decorator';
import { Url } from '@common/decorators/url.decorator';
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GetCardsQueryDto } from './dto/get-cards-query.dto';
import { CardAvatarService } from './services/card-avatar.service';
import { CardGenerationService } from './services/card-generation.service';

@ApiTags('cards')
@Controller('cards')
export class CardsController {
  constructor(
    private readonly generationService: CardGenerationService,
    private readonly avatarService: CardAvatarService,
  ) {}

  @IsPublic()
  @Post('generate')
  generate(
    @Query('season') season?: string,
    @Query('ratingVersion') ratingVersion?: string,
  ) {
    const parsedSeason = season ? Number(season) : 2026;
    return this.generationService.generateFromPlayers(
      Number.isFinite(parsedSeason) ? parsedSeason : 2026,
      ratingVersion?.trim() || 'v1',
    );
  }

  @IsPublic()
  @Get()
  list(@Query() query: GetCardsQueryDto, @Url() url: string) {
    return this.generationService.listCards(
      query.page ?? 1,
      query.limit ?? 100,
      url,
    );
  }

  @IsPublic()
  @Post('avatars/queue')
  queue(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 100;
    return this.avatarService.queue(
      Number.isFinite(parsedLimit) ? parsedLimit : 100,
    );
  }

  @IsPublic()
  @Post('avatars/regenerate/:cardId')
  regenerate(@Param('cardId') cardId: string) {
    return this.avatarService.regenerate(cardId);
  }
}
