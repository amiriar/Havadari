import { READ_USER, UPDATE_USER } from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClansService } from './clans.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/clans')
export class AdminClansController {
  constructor(private readonly clansService: ClansService) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: list clans' })
  @AuthorizeByPermissions([READ_USER])
  listClans(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.clansService.adminListClans(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      q,
      url,
    );
  }

  @Get(':clanId')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get clan details' })
  @AuthorizeByPermissions([READ_USER])
  clanById(@Param('clanId') clanId: string) {
    return this.clansService.adminGetClan(clanId);
  }

  @Get(':clanId/members')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list clan members' })
  @AuthorizeByPermissions([READ_USER])
  members(
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.clansService.adminMembers(
      clanId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get(':clanId/messages')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list clan chat messages' })
  @AuthorizeByPermissions([READ_USER])
  messages(
    @Param('clanId') clanId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 50;
    return this.clansService.adminMessages(
      clanId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 50,
      url,
    );
  }

  @Patch(':clanId/deactivate')
  @ApiOperation({ summary: 'Admin: deactivate clan' })
  @AuthorizeByPermissions([UPDATE_USER])
  deactivate(@Param('clanId') clanId: string) {
    return this.clansService.adminSetClanActive(clanId, false);
  }

  @Patch(':clanId/activate')
  @ApiOperation({ summary: 'Admin: activate clan' })
  @AuthorizeByPermissions([UPDATE_USER])
  activate(@Param('clanId') clanId: string) {
    return this.clansService.adminSetClanActive(clanId, true);
  }

  @Delete(':clanId/members/:memberUserId')
  @ApiOperation({ summary: 'Admin: force remove member from clan' })
  @AuthorizeByPermissions([UPDATE_USER])
  removeMember(
    @Param('clanId') clanId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.clansService.adminRemoveMember(clanId, memberUserId);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Admin: delete clan message' })
  @AuthorizeByPermissions([UPDATE_USER])
  deleteMessage(@Param('messageId') messageId: string) {
    return this.clansService.adminDeleteMessage(messageId);
  }
}

