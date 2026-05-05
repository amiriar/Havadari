import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { NoCache } from '@common/decorators/no-cache';
import { User } from '@common/decorators/user.decorator';
import { Url } from '@common/decorators/url.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClansService } from './clans.service';
import { CreateClanDto } from './dto/create-clan.dto';
import { JoinClanDto } from './dto/join-clan.dto';
import { SendClanMessageDto } from './dto/send-clan-message.dto';

@ApiTags('clans')
@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Post()
  create(@User() user: CurrentUser, @Body() dto: CreateClanDto) {
    return this.clansService.create(user?.id, dto);
  }

  @Post('join')
  join(@User() user: CurrentUser, @Body() dto: JoinClanDto) {
    return this.clansService.join(user?.id, dto);
  }

  @Post('leave')
  leave(@User() user: CurrentUser) {
    return this.clansService.leave(user?.id);
  }

  @Delete(':clanId/members/:memberUserId')
  kick(
    @User() user: CurrentUser,
    @Param('clanId') clanId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.clansService.kick(user?.id, clanId, memberUserId);
  }

  @Get('me')
  @NoCache()
  myClan(@User() user: CurrentUser) {
    return this.clansService.myClan(user?.id);
  }

  @Get(':clanId/members')
  @NoCache()
  members(
    @User() user: CurrentUser,
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.clansService.members(
      user?.id,
      clanId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get(':clanId/chat')
  @NoCache()
  messages(
    @User() user: CurrentUser,
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 50;
    return this.clansService.messages(
      user?.id,
      clanId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 50,
      url,
    );
  }

  @Post(':clanId/chat')
  sendMessage(
    @User() user: CurrentUser,
    @Param('clanId') clanId: string,
    @Body() dto: SendClanMessageDto,
  ) {
    return this.clansService.sendMessage(user?.id, clanId, dto);
  }
}
