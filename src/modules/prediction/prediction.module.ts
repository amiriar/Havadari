import { User } from '@app/auth/entities/user.entity';
import { LeaderboardModule } from '@app/leaderboard/leaderboard.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminPredictionController } from './admin-prediction.controller';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { PredictionBet } from './entities/prediction-bet.entity';
import { PredictionMatch } from './entities/prediction-match.entity';
import { PredictionOption } from './entities/prediction-option.entity';
import { PredictionSettlementLog } from './entities/prediction-settlement-log.entity';

@Module({
  imports: [
    LeaderboardModule,
    TypeOrmModule.forFeature([
      User,
      PredictionMatch,
      PredictionOption,
      PredictionBet,
      PredictionSettlementLog,
    ]),
  ],
  controllers: [PredictionController, AdminPredictionController],
  providers: [PredictionService],
  exports: [PredictionService],
})
export class PredictionModule {}

