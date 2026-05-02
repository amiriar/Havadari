import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { SquadController } from './squad.controller';
import { SquadService } from './squad.service';

@Module({
  imports: [TypeOrmModule.forFeature([Card, UserCard, GameProfile])],
  controllers: [SquadController],
  providers: [SquadService, GameBootstrapService],
})
export class SquadModule {}
