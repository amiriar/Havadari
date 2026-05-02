import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { GrantPermissionToUserDto } from '../dto/grant-permission-to-user.dto';
import { UpdatePermissinDto } from '../dto/update-permission.dto';
import { Permission } from '../entities/permission.entity';
import { PermissionCategory } from '../entities/permission-category.entity';
import { PermissionControllerCode } from '../constants/controller-codes';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly repository: Repository<Permission>,
    @InjectRepository(PermissionCategory)
    private readonly permissoinCatRepository: Repository<PermissionCategory>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll() {
    return this.permissoinCatRepository.find({
      order: {
        name: 'ASC',
      },
      relations: {
        permissions: true,
      },
    });
  }

  findOne(permissionId: string) {
    if (!permissionId) {
      throw new BadRequestException({
        code: `${PermissionControllerCode}01`,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'PermmissionId can not be null',
      });
    }
    const permission = this.repository.findOne({ where: { id: permissionId } });
    if (!permission) {
      throw new NotFoundException({
        code: `${PermissionControllerCode}02`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'Permission' }),
      });
    }
    return permission;
  }

  async create(body: CreatePermissionDto) {
    const permission = this.repository.create({
      name: body.name,
      title: body.title,
      translatedTitle: body.translatedTitle,
      categoryId: body.categoryId,
      guardName: 'api',
      categoryName: body.categoryName,
    });

    return await this.repository.save(permission);
  }

  async update(id: string, body: UpdatePermissinDto) {
    const permissionToupdate = await this.findOne(id);
    const updatedPermission = this.repository.create({
      ...permissionToupdate,
      ...body,
    });
    return this.repository.save(updatedPermission);
  }

  async delete(id: string) {
    await this.repository.softDelete(id);
  }

  async grantToUser(dto: GrantPermissionToUserDto) {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('user_permissions_permission')
      .values(
        dto.permissionIds.map((permissionId) => ({
          userId: dto.userId,
          permissionId: permissionId,
        })),
      )
      .orIgnore()
      .execute();
  }

  async dismissFromUser(dto: GrantPermissionToUserDto) {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('user_permissions_permission')
      .where('userID = :userId', { userId: dto.userId })
      .andWhere('permissionId IN (:...permissionIds)', {
        permissionIds: dto.permissionIds,
      })
      .execute();
  }
}
