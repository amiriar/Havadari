import { AdminAuthorizationGuard } from '@common/guards/http/admin-authorization.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { GrantPermissionToUserDto } from '../dto/grant-permission-to-user.dto';
import { UpdatePermissinDto } from '../dto/update-permission.dto';
import { GeneratePermissionNamePipe } from '../pipes/generate-permission-name.pipe';
import { PermissionService } from '../services/permission.service';
@Controller('permissions')
@UseGuards(AdminAuthorizationGuard)
@ApiTags('Admin')
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Post()
  async create(@Body(GeneratePermissionNamePipe) dto: CreatePermissionDto) {
    return await this.permissionService.create(dto);
  }

  @Put('dissmis-from-user')
  dissmisPermissions(@Body() dto: GrantPermissionToUserDto) {
    return this.permissionService.dismissFromUser(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(GeneratePermissionNamePipe) body: UpdatePermissinDto,
  ) {
    return this.permissionService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    this.permissionService.delete(id);
  }

  @Post('grant-to-user')
  grantPermissions(@Body() dto: GrantPermissionToUserDto) {
    return this.permissionService.grantToUser(dto);
  }
}
