// src/modules/auth/controllers/role.controller.ts

import { AdminAuthorizationGuard } from '@common/guards/http/admin-authorization.guard';
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
import { CreateRoleDto } from '../dto/create-role.dto';
import { GrantPermissionToRoleDto } from '../dto/grant-permission-to-role.dto';
import { GrantToUserDto } from '../dto/grant-role.dto';
import { Permission } from '../entities/permission.entity';
import { RoleService } from '../services/role.service';
import { UpdateRoleDto } from '../dto/update-role.dto';

@UseGuards(AdminAuthorizationGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.create(createRoleDto);
  }

  @Get()
  async findAll() {
    return await this.roleService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.roleService.findOne(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.roleService.delete(id);
  }
  @Post('grant-to-user')
  async grantToUser(@Body() dto: GrantToUserDto) {
    return await this.roleService.grantToUser(dto);
  }

  @Put('dismiss-from-user')
  async dismissFromUser(@Body() dto: GrantToUserDto) {
    return await this.roleService.dismissFromUser(dto);
  }

  @Post('grant-permissions')
  grantPermissions(@Body() dto: GrantPermissionToRoleDto) {
    return this.roleService.grantPermissions(dto);
  }

  @Put('dissmis-permissions')
  dissmisPermissions(@Body() dto: GrantPermissionToRoleDto) {
    return this.roleService.dismissPermissions(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    return await this.roleService.update(id, body);
  }

  @Get(':roleId/permissions')
  getPermissions(@Param('roleId') roleId: string): Promise<Permission[]> {
    return this.roleService.getPermissions(roleId);
  }
}
