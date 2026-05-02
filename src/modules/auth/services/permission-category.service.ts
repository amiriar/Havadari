import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { PermissionCategory } from '../entities/permission-category.entity';
import { AdminAuthorizationGuard } from '@common/guards/http/admin-authorization.guard';
import { PermissionCategoryControllerCode } from '../constants/controller-codes';

@Injectable()
@UseGuards(AdminAuthorizationGuard)
export class PermissionCategoryService {
  constructor(
    @InjectRepository(PermissionCategory)
    private readonly repository: Repository<PermissionCategory>,
  ) {}

  async findAll(query: PaginateQuery, url: string) {
    return await paginate(query, this.repository, {
      sortableColumns: ['name'],
      select: ['id', 'name'],
      origin: url,
    });
  }

  findOne(categoryId: string) {
    if (!categoryId) {
      throw new BadRequestException({
        code: `${PermissionCategoryControllerCode}01`,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'categoryId can not be null',
      });
    }
    const permission = this.repository.findOne({ where: { id: categoryId } });
    if (!permission) {
      throw new NotFoundException({
        code: `${PermissionCategoryControllerCode}02`,
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'Permission' }),
      });
    }
    return permission;
  }
}
