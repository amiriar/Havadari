import { User } from '@app/auth/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';
import { ClanMemberEntity } from './entities/clan-member.entity';
import { ClanMessageEntity } from './entities/clan-message.entity';
import { ClanEntity } from './entities/clan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ClanEntity,
      ClanMemberEntity,
      ClanMessageEntity,
    ]),
  ],
  controllers: [ClansController],
  providers: [ClansService],
  exports: [ClansService],
})
export class ClansModule {}
