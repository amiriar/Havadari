import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Paginate, PaginateQuery } from 'nestjs-paginate';
import { AdminAuthorizationGuard } from '@common/guards/http/admin-authorization.guard';
import { PermissionCategoryService } from '../services/permission-category.service';
import { Url } from '@common/decorators/url.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@Controller('permission-categories')
@UseGuards(AdminAuthorizationGuard)
@ApiTags('Admin')
@ApiBearerAuth()
export class PermissionCategoryController {
  constructor(private readonly categoryService: PermissionCategoryService) {}

  @Get()
  findAll(
    @Paginate() query: PaginateQuery,
    @Url({ excludePath: true }) url: string,
  ) {
    return this.categoryService.findAll(query, url);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }
}
