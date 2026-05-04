import { User } from '@app/auth/entities/user.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate } from 'nestjs-typeorm-paginate';
import { Repository } from 'typeorm';
import { ClanRoleEnum } from './constants/clan.enums';
import { CreateClanDto } from './dto/create-clan.dto';
import { JoinClanDto } from './dto/join-clan.dto';
import { SendClanMessageDto } from './dto/send-clan-message.dto';
import { ClanMemberEntity } from './entities/clan-member.entity';
import { ClanMessageEntity } from './entities/clan-message.entity';
import { ClanEntity } from './entities/clan.entity';

@Injectable()
export class ClansService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ClanEntity)
    private readonly clanRepo: Repository<ClanEntity>,
    @InjectRepository(ClanMemberEntity)
    private readonly memberRepo: Repository<ClanMemberEntity>,
    @InjectRepository(ClanMessageEntity)
    private readonly messageRepo: Repository<ClanMessageEntity>,
  ) {}

  async create(user: User, dto: CreateClanDto) {
    const me = await this.mustUser(user);
    const current = await this.memberRepo.findOne({
      where: { user: { id: me.id } },
    });
    if (current) throw new BadRequestException('User is already in a clan.');
    const existingByName = await this.clanRepo.findOne({
      where: { name: dto.name },
    });
    if (existingByName)
      throw new BadRequestException('Clan name already exists.');

    const clan = await this.clanRepo.save(
      this.clanRepo.create({
        name: dto.name.trim(),
        inviteCode: this.generateInviteCode(),
        maxMembers: dto.maxMembers ?? 30,
        points: 0,
        isActive: true,
      }),
    );
    await this.memberRepo.save(
      this.memberRepo.create({ clan, user: me, role: ClanRoleEnum.OWNER }),
    );
    return { clanId: clan.id, name: clan.name, inviteCode: clan.inviteCode };
  }

  async join(user: User, dto: JoinClanDto) {
    const me = await this.mustUser(user);
    const current = await this.memberRepo.findOne({
      where: { user: { id: me.id } },
    });
    if (current) throw new BadRequestException('User is already in a clan.');

    const clan = dto.clanId
      ? await this.clanRepo.findOne({
          where: { id: dto.clanId, isActive: true },
        })
      : dto.inviteCode
        ? await this.clanRepo.findOne({
            where: { inviteCode: dto.inviteCode, isActive: true },
          })
        : null;
    if (!clan) throw new NotFoundException('Clan not found.');

    const count = await this.memberRepo.count({
      where: { clan: { id: clan.id } },
    });
    if (count >= clan.maxMembers)
      throw new BadRequestException('Clan is full.');

    await this.memberRepo.save(
      this.memberRepo.create({ clan, user: me, role: ClanRoleEnum.MEMBER }),
    );
    return { joined: true, clanId: clan.id };
  }

  async leave(user: User) {
    const me = await this.mustUser(user);
    const member = await this.memberRepo.findOne({
      where: { user: { id: me.id } },
      relations: { clan: true },
    });
    if (!member) throw new NotFoundException('User is not in a clan.');

    if (member.role === ClanRoleEnum.OWNER) {
      const members = await this.memberRepo.find({
        where: { clan: { id: member.clan.id } },
        relations: { user: true },
        order: { createdAt: 'ASC' },
      });
      if (members.length > 1) {
        const nextOwner = members.find((m) => m.user.id !== me.id);
        if (nextOwner) {
          nextOwner.role = ClanRoleEnum.OWNER;
          await this.memberRepo.save(nextOwner);
        }
      } else {
        member.clan.isActive = false;
        await this.clanRepo.save(member.clan);
      }
    }

    await this.memberRepo.delete(member.id);
    return { left: true };
  }

  async kick(user: User, clanId: string, memberUserId: string) {
    const me = await this.mustUser(user);
    const actor = await this.memberRepo.findOne({
      where: { user: { id: me.id }, clan: { id: clanId } },
    });
    if (!actor) throw new ForbiddenException('You are not in this clan.');
    if (![ClanRoleEnum.OWNER, ClanRoleEnum.ADMIN].includes(actor.role)) {
      throw new ForbiddenException('Only owner/admin can kick members.');
    }
    const target = await this.memberRepo.findOne({
      where: { user: { id: memberUserId }, clan: { id: clanId } },
      relations: { user: true },
    });
    if (!target) throw new NotFoundException('Clan member not found.');
    if (target.role === ClanRoleEnum.OWNER) {
      throw new BadRequestException('Owner cannot be kicked.');
    }
    if (actor.user.id === target.user.id) {
      throw new BadRequestException('Use leave endpoint for yourself.');
    }
    await this.memberRepo.delete(target.id);
    return { kicked: true, memberUserId };
  }

  async myClan(user: User) {
    const me = await this.mustUser(user);
    const member = await this.memberRepo.findOne({
      where: { user: { id: me.id } },
      relations: { clan: true },
    });
    if (!member) return null;
    const membersCount = await this.memberRepo.count({
      where: { clan: { id: member.clan.id } },
    });
    return {
      clanId: member.clan.id,
      name: member.clan.name,
      inviteCode:
        member.role === ClanRoleEnum.OWNER ? member.clan.inviteCode : null,
      maxMembers: member.clan.maxMembers,
      points: member.clan.points,
      role: member.role,
      membersCount,
    };
  }

  async members(
    user: User,
    clanId: string,
    page = 1,
    limit = 20,
    url?: string,
  ) {
    const me = await this.mustUser(user);
    const myMembership = await this.memberRepo.findOne({
      where: { user: { id: me.id }, clan: { id: clanId } },
    });
    if (!myMembership)
      throw new ForbiddenException('You are not a member of this clan.');
    return paginate(
      this.memberRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: { clan: { id: clanId } },
        relations: { user: true },
        order: { createdAt: 'ASC' },
      },
    );
  }

  async sendMessage(user: User, clanId: string, dto: SendClanMessageDto) {
    const me = await this.mustUser(user);
    const member = await this.memberRepo.findOne({
      where: { user: { id: me.id }, clan: { id: clanId } },
      relations: { clan: true },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this clan.');

    // TODO: move clan chat delivery to Socket.io realtime broadcast.
    const msg = await this.messageRepo.save(
      this.messageRepo.create({
        clan: member.clan,
        sender: me,
        message: dto.message.trim(),
      }),
    );
    return { sent: true, messageId: msg.id, createdAt: msg.createdAt };
  }

  async messages(
    user: User,
    clanId: string,
    page = 1,
    limit = 50,
    url?: string,
  ) {
    const me = await this.mustUser(user);
    const member = await this.memberRepo.findOne({
      where: { user: { id: me.id }, clan: { id: clanId } },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this clan.');

    return paginate(
      this.messageRepo,
      { page, limit: Math.min(limit, 200), route: url },
      {
        where: { clan: { id: clanId } },
        relations: { sender: true },
        order: { createdAt: 'DESC' },
      },
    );
  }

  private generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private async mustUser(user?: User) {
    if (!user?.id) throw new UnauthorizedException('Authentication required.');
    const found = await this.userRepo.findOne({ where: { id: user.id } });
    if (!found) throw new UnauthorizedException('User not found.');
    return found;
  }
}
