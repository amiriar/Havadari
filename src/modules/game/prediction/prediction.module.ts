import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { Prediction } from '../entities/prediction.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prediction, GameProfile, Card, UserCard]),
  ],
  controllers: [PredictionController],
  providers: [PredictionService, GameBootstrapService],
})
export class PredictionModule {}
