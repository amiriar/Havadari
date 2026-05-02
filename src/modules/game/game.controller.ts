import { IsPublic } from '@common/decorators/is-public.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  FindMarketListingsDto,
  ListCardDto,
  OpenChestDto,
  PlaceBidDto,
  PlacePredictionDto,
  UpdateSquadDto,
} from './dto/game.dto';
import { GameService } from './game.service';

@IsPublic()
@ApiTags('game')
@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('user/profile')
  getProfile() {
    return this.gameService.getProfile();
  }

  @Put('user/profile')
  updateProfile(@Body() body: Record<string, unknown>) {
    return this.gameService.updateProfile(body);
  }

  @Get('user/cards')
  getCards() {
    return this.gameService.getCards();
  }

  @Get('user/squad')
  getSquad() {
    return this.gameService.getSquad();
  }

  @Put('user/squad')
  updateSquad(@Body() dto: UpdateSquadDto) {
    return this.gameService.updateSquad(dto.cardIds);
  }

  @Get('user/stats')
  getStats() {
    return this.gameService.getStats();
  }

  @Post('battle/find-match')
  findMatch() {
    return this.gameService.findMatch();
  }

  @Post('battle/start')
  startBattle(@Body('type') type: string) {
    return this.gameService.startBattle(type);
  }

  @Post('battle/play-round')
  playRound(
    @Body('player1CardId') player1CardId: string,
    @Body('player2CardId') player2CardId: string,
    @Body('category') category: any,
  ) {
    return this.gameService.playRound(player1CardId, player2CardId, category);
  }

  @Post('battle/end')
  endBattle(@Body('type') type: string) {
    return this.gameService.endBattle(type);
  }

  @Get('battle/history')
  history() {
    return this.gameService.getBattleHistory();
  }

  @Get('market/listings')
  listings(@Query() _query: FindMarketListingsDto) {
    return this.gameService.getMarketListings();
  }

  @Post('market/list')
  listCard(@Body() dto: ListCardDto) {
    return this.gameService.listCard(dto.cardId, dto.price);
  }

  @Post('market/buy/:listingId')
  buy(@Param('listingId') listingId: string) {
    return this.gameService.buyCard(listingId);
  }

  @Post('market/bid/:listingId')
  bid(@Param('listingId') listingId: string, @Body() dto: PlaceBidDto) {
    return this.gameService.bid(listingId, dto.amount);
  }

  @Delete('market/listing/:listingId')
  cancelListing(@Param('listingId') listingId: string) {
    return this.gameService.removeListing(listingId);
  }

  @Get('shop/chests')
  chests() {
    return this.gameService.getChests();
  }

  @Post('chest/open/:chestType')
  openChest(@Param() dto: OpenChestDto) {
    return this.gameService.openChest(dto.chestType);
  }

  @Post('purchase/gems')
  buyGems(@Body('gems') gems: number) {
    return this.gameService.purchaseGems(gems);
  }

  @Get('purchase/history')
  purchaseHistory() {
    return this.gameService.getPurchaseHistory();
  }

  @Get('prediction/matches')
  predictionMatches() {
    return this.gameService.getPredictionMatches();
  }

  @Post('prediction/place')
  placePrediction(@Body() dto: PlacePredictionDto) {
    return this.gameService.placePrediction(dto);
  }

  @Get('prediction/my-predictions')
  myPredictions() {
    return this.gameService.myPredictions();
  }

  @Get('leaderboard/:type')
  leaderboard(@Param('type') type: string, @Query('region') region: string) {
    return this.gameService.getLeaderboard(type, region);
  }
}
