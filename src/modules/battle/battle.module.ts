import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { ProgressionModule } from '@app/progression/progression.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { BattleRound } from './entities/battle-round.entity';
import { Battle } from './entities/battle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, UserCard, Battle, BattleRound]),
    ProgressionModule,
  ],
  controllers: [BattleController],
  providers: [BattleService],
  exports: [BattleService],
})
export class BattleModule {}
