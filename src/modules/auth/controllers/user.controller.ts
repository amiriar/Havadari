import { UploadDocumentConfig } from '@app/file/configs/upload-document.config';
import { UploadImageConfig } from '@app/file/configs/upload-image.config';
import {
  CREATE_USER,
  DELETE_USER,
  READ_USER,
  RECOVER_USER,
  UPDATE_USER,
} from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { PaginateQueryOptions } from '@common/decorators/paginate-query-optionts.decorator';
import { Url } from '@common/decorators/url.decorator';
import { User } from '@common/decorators/user.decorator';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { AdminAuthorizationGuard } from '@common/guards/http/admin-authorization.guard';
import { StripUserSecretsInterCeptor } from '@common/interceptos/strip-user-secrets.interceptor';
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiResponse } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { FindUsersDto } from '../dto/find-users.dto';
import { PaginatedFindAllUsersByRolenameResponse } from '../dto/paginated-find-all-users-by-role-name-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { updateProfileDto } from '../dto/update-profile.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserPaginatedResopnse } from '../dto/user-paginated-response.dto';
import { VerifyUserDto } from '../dto/verify-user.dto';
import { Permission } from '../entities/permission.entity';
import {
  User as CurrentUser,
  User as UserEntity,
} from '../entities/user.entity';
import { HashPasswordPipe } from '../pipes/hash-password.pipe';
import { LoadRolesPipe } from '../pipes/load-roles.pipe';
import { SearchQueryPipe } from '../pipes/search-query.pipe';
import { SetGuestRolePipe } from '../pipes/set-guest-role.pipe';
import { UserService } from '../services/user.service';
import { DailyLoginService } from '../services/daily-login.service';
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly dailyLoginService: DailyLoginService,
  ) {}

  @Get()
  @ApiResponse({ type: UserPaginatedResopnse })
  @AuthorizeByPermissions([READ_USER])
  @UseInterceptors(StripUserSecretsInterCeptor)
  async findAll(
    @Query(BooleanPipe, SearchQueryPipe, SetPaginationOptionsPipe)
    searchQuery: FindUsersDto,
    @Url() url: string,
  ) {
    return await this.userService.findAll(
      searchQuery as PaginationQuery<FindUsersDto>,
      url,
    );
  }

  // @Get('893444fdkfSEE')
  // async setAllAvatars() {
  //   return await this.userService.setAllAvatars();
  // }

  @Get('find-all-by-rolename')
  @PaginateQueryOptions({
    filterOptions: [{ field: 'roles.name', example: '$eq:SUPER_ADMIN' }],
    sortOptions: [{ example: 'createdAt:ASC' }, { example: 'updatedAt:ASC' }],
  })
  @ApiOkResponse({ type: PaginatedFindAllUsersByRolenameResponse })
  @AuthorizeByPermissions([READ_USER])
  findAllByRolename(
    @Paginate() query: PaginateQuery,
    @Url({ excludePath: true }) url: string,
  ): Promise<Paginated<CurrentUser> | Array<CurrentUser>> {
    return this.userService.findAllByRolename(query, url);
  }

  @NoCache()
  @Get('profile')
  async getProfile(@User() user: CurrentUser) {
    return await this.userService.findOne(user?.id);
  }

  @UseInterceptors(StripUserSecretsInterCeptor)
  @AuthorizeByPermissions([READ_USER])
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @UseInterceptors(StripUserSecretsInterCeptor)
  @Post()
  @AuthorizeByPermissions([CREATE_USER])
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'avatar' }, { name: 'signature' }, { name: 'fingerprint' }],
      new UploadImageConfig(),
    ),
  )
  async create(
    @Body(HashPasswordPipe, SetGuestRolePipe, LoadRolesPipe) body: RegisterDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return await this.userService.create(body, files);
  }

  @Put('profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'avatar' }, { name: 'signature' }],
      new UploadImageConfig(),
    ),
    StripUserSecretsInterCeptor,
  )
  updateProfile(
    @User() user: CurrentUser,
    @Body(HashPasswordPipe)
    body: updateProfileDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.userService.update(user?.id, body, files);
  }

  @Put(':id')
  @AuthorizeByPermissions([UPDATE_USER], UserEntity)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'avatar' }, { name: 'signature' }],
      new UploadImageConfig(),
    ),
    StripUserSecretsInterCeptor,
  )
  update(
    @Param('id') id: string,
    @Body(HashPasswordPipe, LoadRolesPipe)
    body: UpdateUserDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.userService.update(id, body, files);
  }

  @Delete(':id')
  @AuthorizeByPermissions([DELETE_USER], UserEntity)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
  }

  @Patch(':id')
  @AuthorizeByPermissions([RECOVER_USER])
  async restore(@Param('id') id: string) {
    await this.userService.recover(id);
  }

  @NoCache()
  @Get('profile/permissions')
  async getPermissions(@User() user: CurrentUser): Promise<Array<Permission>> {
    return await this.userService.getPermissions(user);
  }

  @NoCache()
  @Get('profile/roles')
  async getRoles(@User() user: CurrentUser) {
    return user.roles.map((role) => {
      delete role.permissions;
      return role;
    });
  }

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar' },
        { name: 'signature' },
        { name: 'fingerprint' },
        { name: 'document' },
      ],
      new UploadDocumentConfig(),
    ),
  )
  @Post(':id/files')
  async upload(
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.userService.setFiles(id, files);
  }

  @Get(':id/files')
  async getFiles(@Param('id') id: string) {
    return await this.userService.getFiles(id);
  }

  @Put(':id/verify')
  @UseGuards(AdminAuthorizationGuard)
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new AtLeastOnePipe(['isEmailVerified', 'isPhoneVerified']))
    body: VerifyUserDto,
  ) {
    return await this.userService.verify(id, body);
  }

  @Get('profile/daily-login/status')
  async dailyLoginStatus(@User() user: CurrentUser) {
    return this.dailyLoginService.status(user?.id);
  }

  @Post('profile/daily-login/claim')
  async claimDailyLogin(@User() user: CurrentUser) {
    return this.dailyLoginService.claim(user?.id);
  }

  @Get('profile/daily-login/history')
  async dailyLoginHistory(
    @User() user: CurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.dailyLoginService.history(
      user?.id,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }
}
