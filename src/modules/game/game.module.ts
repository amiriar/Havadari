import { Module } from '@nestjs/common';
import { BattleModule } from './battle/battle.module';
import { CardsModule } from './cards/cards.module';
import { ChestsModule } from './chests/chests.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { MarketModule } from './market/market.module';
import { PredictionModule } from './prediction/prediction.module';
import { ProfileModule } from './profile/profile.module';
import { SquadModule } from './squad/squad.module';

@Module({
  imports: [
    ProfileModule,
    CardsModule,
    SquadModule,
    BattleModule,
    MarketModule,
    ChestsModule,
    PredictionModule,
    LeaderboardModule,
  ],
})
export class GameModule {}
