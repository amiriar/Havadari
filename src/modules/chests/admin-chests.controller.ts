import {
  READ_USER,
  UPDATE_USER,
} from '@common/constants/permissions_name/user';
import { AuthorizeByPermissions } from '@common/decorators/authorize-by-permissions.decorator';
import { NoCache } from '@common/decorators/no-cache';
import { Url } from '@common/decorators/url.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChestTypeEnum } from './constants/chest.types';
import { ChestsService } from './chests.service';
import { AdminUpdateChestDefinitionDto } from './dto/admin-update-chest-definition.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/chests')
export class AdminChestsController {
  constructor(private readonly chestsService: ChestsService) {}

  @Get('definitions')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list chest definitions' })
  @AuthorizeByPermissions([READ_USER])
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  listDefinitions(@Query('includeInactive') includeInactive?: string) {
    const parsed =
      includeInactive === undefined ? true : includeInactive === 'true';
    return this.chestsService.adminListDefinitions(parsed);
  }

  @Patch('definitions/:type')
  @ApiOperation({ summary: 'Admin: update chest definition' })
  @AuthorizeByPermissions([UPDATE_USER])
  updateDefinition(
    @Param('type') type: ChestTypeEnum,
    @Body() dto: AdminUpdateChestDefinitionDto,
  ) {
    return this.chestsService.adminUpdateDefinition(type, dto);
  }

  @Get('open-logs')
  @NoCache()
  @ApiOperation({ summary: 'Admin: list chest open logs (all users)' })
  @AuthorizeByPermissions([READ_USER])
  logs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Url() url?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.chestsService.adminListOpenLogs(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      url,
    );
  }

  @Get('users/:userId/inventory')
  @NoCache()
  @ApiOperation({ summary: 'Admin: get user chest inventory' })
  @AuthorizeByPermissions([READ_USER])
  userInventory(@Param('userId') userId: string) {
    return this.chestsService.adminGetUserInventory(userId);
  }

  @Post('users/:userId/inventory/:type')
  @ApiOperation({ summary: 'Admin: set user chest inventory quantity' })
  @AuthorizeByPermissions([UPDATE_USER])
  @ApiQuery({ name: 'quantity', required: true, type: Number })
  setUserInventory(
    @Param('userId') userId: string,
    @Param('type') type: ChestTypeEnum,
    @Query('quantity') quantity: string,
  ) {
    const parsedQty = Number(quantity);
    return this.chestsService.adminSetUserInventory(
      userId,
      type,
      Number.isFinite(parsedQty) ? parsedQty : -1,
    );
  }
}

