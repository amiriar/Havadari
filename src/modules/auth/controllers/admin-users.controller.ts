import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  RECOVER_USER,
  UPDATE_USER,
} from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { AtLeastOnePipe } from '@common/pipes/at-least-one.pipe';
import { BooleanPipe } from '@common/pipes/boolean.pipe';
import { SetPaginationOptionsPipe } from '@common/pipes/set-pagination-options.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindUsersDto } from '../dto/find-users.dto';
import { RegisterDto } from '../dto/register.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPaginatedResopnse } from '../dto/user-paginated-response.dto';
import { VerifyUserDto } from '../dto/verify-user.dto';
import { User as UserEntity } from '../entities/user.entity';
import { HashPasswordPipe } from '../pipes/hash-password.pipe';
import { LoadRolesPipe } from '../pipes/load-roles.pipe';
import { SearchQueryPipe } from '../pipes/search-query.pipe';
import { SetGuestRolePipe } from '../pipes/set-guest-role.pipe';
import { UserService } from '../services/user.service';
import { StripUserSecretsInterCeptor } from '@common/interceptos/strip-user-secrets.interceptor';
import { AdminAdjustUserWalletDto } from '../dto/admin-adjust-user-wallet.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @NoCache()
  @ApiOperation({ summary: 'Admin: list users' })
  @ApiResponse({ type: UserPaginatedResopnse })
  @AuthorizeByPermissions([READ_USER])
  @UseInterceptors(StripUserSecretsInterCeptor)
  async findAll(
    @Query(BooleanPipe, SearchQueryPipe, SetPaginationOptionsPipe)
    searchQuery: FindUsersDto,
    @Url() url: string,
  ) {
    return this.userService.findAll(
      searchQuery as PaginationQuery<FindUsersDto>,
      url,
    );
  }

  @Get(':id')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get user by id' })
  @AuthorizeByPermissions([READ_USER])
  @UseInterceptors(StripUserSecretsInterCeptor)
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create user' })
  @AuthorizeByPermissions([CREATE_USER])
  async create(
    @Body(HashPasswordPipe, SetGuestRolePipe, LoadRolesPipe) body: RegisterDto,
  ) {
    return this.userService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: update user' })
  @AuthorizeByPermissions([UPDATE_USER], UserEntity)
  async update(
    @Param('id') id: string,
    @Body(HashPasswordPipe, LoadRolesPipe) body: UpdateUserDto,
  ) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: soft delete user' })
  @AuthorizeByPermissions([DELETE_USER], UserEntity)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { deleted: true, userId: id };
  }

  @Patch(':id/recover')
  @ApiOperation({ summary: 'Admin: recover soft deleted user' })
  @AuthorizeByPermissions([RECOVER_USER])
  async restore(@Param('id') id: string) {
    await this.userService.recover(id);
    return { recovered: true, userId: id };
  }

  @Put(':id/verify')
  @ApiOperation({ summary: 'Admin: verify user email/phone' })
  @AuthorizeByPermissions([UPDATE_USER], UserEntity)
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new AtLeastOnePipe(['isEmailVerified', 'isPhoneVerified']))
    body: VerifyUserDto,
  ) {
    return this.userService.verify(id, body);
  }

  @Post(':id/wallet-adjust')
  @ApiOperation({ summary: 'Admin: adjust user wallet balances (FGC/Gems)' })
  @AuthorizeByPermissions([UPDATE_USER], UserEntity)
  async adjustWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new AtLeastOnePipe(['fgcDelta', 'gemsDelta']))
    body: AdminAdjustUserWalletDto,
  ) {
    return this.userService.adjustWallet(id, body);
  }
}

