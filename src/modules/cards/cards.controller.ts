import { IsPublic } from '@common/decorators/is-public.decorator';
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  generate(@Query('season') season?: string) {
    const parsedSeason = season ? Number(season) : 2026;
    return this.generationService.generateFromPlayers(
      Number.isFinite(parsedSeason) ? parsedSeason : 2026,
    );
  }

  @IsPublic()
  @Get()
  list(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 500;
    return this.generationService.listCards(
      Number.isFinite(parsedLimit) ? parsedLimit : 500,
    );
  }

  @IsPublic()
  @Post('avatars/queue')
  queue(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 100;
    return this.avatarService.queue(Number.isFinite(parsedLimit) ? parsedLimit : 100);
  }

  @IsPublic()
  @Post('avatars/regenerate/:cardId')
  regenerate(@Param('cardId') cardId: string) {
    return this.avatarService.regenerate(cardId);
  }
}

