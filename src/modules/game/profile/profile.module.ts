import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameProfile } from '../entities/game-profile.entity';
import { UserCard } from '../entities/user-card.entity';
import { GameBootstrapService } from '../services/game-bootstrap.service';
import { Card } from '../entities/card.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameProfile, UserCard, Card])],
  controllers: [ProfileController],
  providers: [ProfileService, GameBootstrapService],
  exports: [ProfileService],
})
export class ProfileModule {}
