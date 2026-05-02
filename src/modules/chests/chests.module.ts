import { User } from '@app/auth/entities/user.entity';
import { Card } from '@app/cards/entities/card.entity';
import { UserCard } from '@app/cards/entities/user-card.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChestsController } from './chests.controller';
import { ChestsService } from './chests.service';
import { ChestOpenLog } from './entities/chest-open-log.entity';
import { UserChestState } from './entities/user-chest-state.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Card, UserCard, UserChestState, ChestOpenLog]),
  ],
  controllers: [ChestsController],
  providers: [ChestsService],
  exports: [ChestsService],
})
export class ChestsModule {}

