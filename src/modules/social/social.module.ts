import { User } from '@app/auth/entities/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequestEntity } from './entities/friend-request.entity';
import { FriendshipEntity } from './entities/friendship.entity';
import { GiftEntity } from './entities/gift.entity';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FriendRequestEntity, FriendshipEntity, GiftEntity]),
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}

