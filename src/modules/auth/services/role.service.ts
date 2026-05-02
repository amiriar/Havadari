import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateRoleDto } from '../dto/create-role.dto';
import { GrantPermissionToRoleDto } from '../dto/grant-permission-to-role.dto';
import { GrantToUserDto } from '../dto/grant-role.dto';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleControllerCode } from '../constants/controller-codes';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async findAll() {
    return await this.roleRepository.find({ relations: ['permissions'] });
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleRepository.save(createRoleDto);
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException({
        code: `${RoleControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'Role' }),
      });
    }
    return role;
  }

  async findOneByName(name: string) {
    const role = await this.roleRepository.findOne({
      where: { name: name },
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException({
        code: `${RoleControllerCode}01`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'Role' }),
      });
    }
    return role;
  }

  async delete(roleId: string) {
    this.roleRepository.delete(roleId);
  }

  async grantToUser(dto: GrantToUserDto) {
    const { userId, roleId } = dto;

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('user_roles_role')
      .values({ userId, roleId })
      .orIgnore()
      .execute();
  }

  async grantToUserByName(userId: string, roleName: string) {
    const role: Role = await this.findOneByName(roleName);
    const roleId = role.id;
    await this.grantToUser({ roleId: roleId, userId: userId });
  }

  async dismissFromUser(dto: GrantToUserDto) {
    const { userId, roleId } = dto;
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('user_roles_role')
      .where('userId = :userId', { userId })
      .andWhere('roleId = :roleId', { roleId })
      .execute();
  }

  async grantPermissions(dto: GrantPermissionToRoleDto) {
    const { roleId, permissionIds } = dto;

    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('role_permissions_permission')
      .values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      )
      .orIgnore()
      .execute();
  }

  async dismissPermissions(dto: GrantPermissionToRoleDto): Promise<void> {
    const { roleId, permissionIds } = dto;

    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('role_permissions_permission')
      .where('roleId = :roleId', { roleId })
      .andWhere('permissionId IN (:...permissionIds)', { permissionIds })
      .execute();
  }

  async getPermissions(roleId: string): Promise<Permission[]> {
    const role = await this.findOne(roleId);
    return role.permissions;
  }

  async update(id: string, body: UpdateRoleDto) {
    await this.roleRepository.update(id, body);
    return body;
  }
}
