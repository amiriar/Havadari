import { User } from '@app/auth/entities/user.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { DataSource, MoreThan, Repository } from 'typeorm';
import {
  FriendRequestStatusEnum,
  GiftStatusEnum,
  GiftTypeEnum,
} from './constants/social.enums';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { SendGiftDto } from './dto/send-gift.dto';
import { FriendRequestEntity } from './entities/friend-request.entity';
import { FriendshipEntity } from './entities/friendship.entity';
import { GiftEntity } from './entities/gift.entity';
import { UserChestInventory } from '@app/chests/entities/user-chest-inventory.entity';
import { ChestTypeEnum } from '@app/chests/constants/chest.types';

const MAX_FRIENDS = 100;
const DAILY_SEND_LIMIT = 5;
const DAILY_RECEIVE_LIMIT = 5;
const FGC_GIFT_AMOUNT = 100;

@Injectable()
export class SocialService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserChestInventory)
    private readonly inventoryRepo: Repository<UserChestInventory>,
    @InjectRepository(FriendRequestEntity)
    private readonly requestRepo: Repository<FriendRequestEntity>,
    @InjectRepository(FriendshipEntity)
    private readonly friendshipRepo: Repository<FriendshipEntity>,
    @InjectRepository(GiftEntity)
    private readonly giftRepo: Repository<GiftEntity>,
  ) {}

  async sendFriendRequest(user: User, dto: SendFriendRequestDto) {
    const me = await this.mustUser(user);
    const target = await this.resolveTarget(dto);
    if (!target) throw new NotFoundException('Target user not found.');
    if (target.id === me.id)
      throw new BadRequestException('Cannot friend yourself.');

    const isAlreadyFriend = await this.areFriends(me.id, target.id);
    if (isAlreadyFriend) throw new BadRequestException('Already friends.');

    const existingPending = await this.requestRepo.findOne({
      where: {
        fromUser: { id: me.id },
        toUser: { id: target.id },
        status: FriendRequestStatusEnum.PENDING,
      },
    });
    if (existingPending)
      throw new BadRequestException('Request already pending.');

    const reversePending = await this.requestRepo.findOne({
      where: {
        fromUser: { id: target.id },
        toUser: { id: me.id },
        status: FriendRequestStatusEnum.PENDING,
      },
    });
    if (reversePending) {
      return this.acceptFriendRequest(me, reversePending.id);
    }

    const mineCount = await this.friendsCount(me.id);
    const targetCount = await this.friendsCount(target.id);
    if (mineCount >= MAX_FRIENDS || targetCount >= MAX_FRIENDS) {
      throw new BadRequestException('Friend limit reached.');
    }

    const request = await this.requestRepo.save(
      this.requestRepo.create({
        fromUser: me,
        toUser: target,
        status: FriendRequestStatusEnum.PENDING,
      }),
    );
    return { sent: true, requestId: request.id };
  }

  async acceptFriendRequest(user: User, requestId: string) {
    const me = await this.mustUser(user);
    const request = await this.requestRepo.findOne({
      where: { id: requestId, toUser: { id: me.id } },
      relations: { fromUser: true, toUser: true },
    });
    if (!request || request.status !== FriendRequestStatusEnum.PENDING) {
      throw new NotFoundException('Pending friend request not found.');
    }

    const mineCount = await this.friendsCount(me.id);
    const otherCount = await this.friendsCount(request.fromUser.id);
    if (mineCount >= MAX_FRIENDS || otherCount >= MAX_FRIENDS) {
      throw new BadRequestException('Friend limit reached.');
    }

    const [a, b] = this.normalizedPair(request.fromUser.id, request.toUser.id);
    const exists = await this.friendshipRepo.findOne({
      where: { userA: { id: a }, userB: { id: b } },
    });
    if (!exists) {
      await this.friendshipRepo.save(
        this.friendshipRepo.create({
          userA: { id: a } as User,
          userB: { id: b } as User,
        }),
      );
    }
    request.status = FriendRequestStatusEnum.ACCEPTED;
    await this.requestRepo.save(request);
    return { accepted: true, requestId };
  }

  async rejectFriendRequest(user: User, requestId: string) {
    const me = await this.mustUser(user);
    const request = await this.requestRepo.findOne({
      where: { id: requestId, toUser: { id: me.id } },
    });
    if (!request || request.status !== FriendRequestStatusEnum.PENDING) {
      throw new NotFoundException('Pending friend request not found.');
    }
    request.status = FriendRequestStatusEnum.REJECTED;
    await this.requestRepo.save(request);
    return { rejected: true, requestId };
  }

  async removeFriend(user: User, friendUserId: string) {
    const me = await this.mustUser(user);
    const [a, b] = this.normalizedPair(me.id, friendUserId);
    const friendship = await this.friendshipRepo.findOne({
      where: { userA: { id: a }, userB: { id: b } },
    });
    if (!friendship) throw new NotFoundException('Friendship not found.');
    await this.friendshipRepo.delete(friendship.id);
    return { removed: true, friendUserId };
  }

  async listFriends(user: User, page = 1, limit = 20, url?: string) {
    const me = await this.mustUser(user);
    const qb = this.friendshipRepo
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.userA', 'userA')
      .leftJoinAndSelect('friendship.userB', 'userB')
      .where('userA.id = :uid OR userB.id = :uid', { uid: me.id })
      .orderBy('friendship.createdAt', 'DESC');

    const paged = await paginate(qb, {
      page,
      limit: Math.min(limit, 200),
      route: url,
    });
    return {
      ...paged,
      items: paged.items.map((f) => {
        const friend = f.userA.id === me.id ? f.userB : f.userA;
        return {
          friendshipId: f.id,
          userId: friend.id,
          userName: friend.userName,
          fullName: friend.fullName,
          avatar: friend.avatar,
        };
      }),
    };
  }

  async listIncomingRequests(user: User, page = 1, limit = 20, url?: string) {
    const me = await this.mustUser(user);
    return paginate(
      this.requestRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: {
          toUser: { id: me.id },
          status: FriendRequestStatusEnum.PENDING,
        },
        relations: { fromUser: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  async sendGift(user: User, dto: SendGiftDto) {
    const me = await this.mustUser(user);
    if (dto.toUserId === me.id)
      throw new BadRequestException('Cannot gift yourself.');
    const target = await this.userRepo.findOne({ where: { id: dto.toUserId } });
    if (!target) throw new NotFoundException('Target user not found.');

    const areFriends = await this.areFriends(me.id, target.id);
    if (!areFriends) throw new BadRequestException('Users are not friends.');

    const startOfDay = this.startOfUtcDay();
    const sentToday = await this.giftRepo.count({
      where: { fromUser: { id: me.id }, createdAt: MoreThan(startOfDay) },
    });
    if (sentToday >= DAILY_SEND_LIMIT) {
      throw new BadRequestException('Daily gift send limit reached.');
    }
    const receivedToday = await this.giftRepo.count({
      where: { toUser: { id: target.id }, createdAt: MoreThan(startOfDay) },
    });
    if (receivedToday >= DAILY_RECEIVE_LIMIT) {
      throw new BadRequestException('Receiver daily gift limit reached.');
    }

    const type = dto.type || GiftTypeEnum.FGC;
    if (type === GiftTypeEnum.FGC && me.fgc < FGC_GIFT_AMOUNT) {
      throw new BadRequestException('Not enough FGC to send gift.');
    }
    if (type === GiftTypeEnum.CHEST && !dto.chestType) {
      throw new BadRequestException('chestType is required for chest gift.');
    }

    if (type === GiftTypeEnum.FGC) {
      me.fgc -= FGC_GIFT_AMOUNT;
      await this.userRepo.save(me);
    }

    const gift = await this.giftRepo.save(
      this.giftRepo.create({
        fromUser: me,
        toUser: target,
        type,
        amountFgc: type === GiftTypeEnum.FGC ? FGC_GIFT_AMOUNT : 0,
        chestType: type === GiftTypeEnum.CHEST ? dto.chestType || null : null,
        status: GiftStatusEnum.SENT,
        claimedAt: null,
      }),
    );
    return { sent: true, giftId: gift.id };
  }

  async claimGift(user: User, giftId: string) {
    const me = await this.mustUser(user);
    return this.dataSource.transaction(async (manager) => {
      const gift = await manager
        .getRepository(GiftEntity)
        .createQueryBuilder('gift')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('gift.toUser', 'toUser')
        .where('gift.id = :giftId', { giftId })
        .andWhere('toUser.id = :userId', { userId: me.id })
        .getOne();

      if (!gift || gift.status !== GiftStatusEnum.SENT) {
        throw new NotFoundException('Claimable gift not found.');
      }

      const receiver = await manager.getRepository(User).findOne({
        where: { id: me.id },
      });
      if (!receiver) throw new UnauthorizedException('User not found.');

      if (gift.type === GiftTypeEnum.FGC && gift.amountFgc > 0) {
        receiver.fgc += gift.amountFgc;
        await manager.getRepository(User).save(receiver);
      } else if (gift.type === GiftTypeEnum.CHEST) {
        const chestType = gift.chestType as ChestTypeEnum | null;
        if (!chestType) {
          throw new BadRequestException('Invalid gifted chest type.');
        }
        let inventory = await manager
          .getRepository(UserChestInventory)
          .findOne({
            where: { user: { id: receiver.id }, chestType },
          });
        if (!inventory) {
          inventory = manager.getRepository(UserChestInventory).create({
            user: receiver,
            chestType,
            quantity: 0,
          });
        }
        inventory.quantity += 1;
        await manager.getRepository(UserChestInventory).save(inventory);
      }

      gift.status = GiftStatusEnum.CLAIMED;
      gift.claimedAt = new Date();
      await manager.getRepository(GiftEntity).save(gift);

      return {
        claimed: true,
        giftId: gift.id,
        reward: {
          type: gift.type,
          amountFgc: gift.amountFgc,
          chestType: gift.chestType,
        },
        balance: { fgc: receiver.fgc, gems: receiver.gems },
      };
    });
  }

  async myGifts(user: User, page = 1, limit = 20, url?: string) {
    const me = await this.mustUser(user);
    return paginate(
      this.giftRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: { toUser: { id: me.id } },
        relations: { fromUser: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  private async resolveTarget(dto: SendFriendRequestDto) {
    if (dto.toUserId) {
      return this.userRepo.findOne({ where: { id: dto.toUserId } });
    }
    if (dto.toUserName) {
      return this.userRepo.findOne({ where: { userName: dto.toUserName } });
    }
    throw new BadRequestException('toUserId or toUserName is required.');
  }

  private normalizedPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private async areFriends(userAId: string, userBId: string) {
    const [a, b] = this.normalizedPair(userAId, userBId);
    const row = await this.friendshipRepo.findOne({
      where: { userA: { id: a }, userB: { id: b } },
    });
    return Boolean(row);
  }

  private async friendsCount(userId: string) {
    return this.friendshipRepo
      .createQueryBuilder('friendship')
      .leftJoin('friendship.userA', 'userA')
      .leftJoin('friendship.userB', 'userB')
      .where('userA.id = :uid OR userB.id = :uid', { uid: userId })
      .getCount();
  }

  private startOfUtcDay() {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
  }

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
