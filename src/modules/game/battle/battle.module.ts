import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleRound } from '../entities/battle-round.entity';
import { Battle } from '../entities/battle.entity';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Battle,
      BattleRound,
      UserCard,
      GameProfile,
      Card,
    ]),
  ],
  controllers: [BattleController],
  providers: [BattleService, GameBootstrapService],
})
export class BattleModule {}
