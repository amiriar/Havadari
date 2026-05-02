import { BadRequestException, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PermissionCategory } from '../entities/permission-category.entity';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

export class GeneratePermissionNamePipe implements PipeTransform {
  constructor(
    @InjectRepository(PermissionCategory)
    private readonly categoryRepository: Repository<PermissionCategory>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async transform(value: any) {
    const category = await this.categoryRepository.findOne({
      where: { id: value.categoryId },
    });
    if (value.accessLevel) {
      value.name = value.accessLevel.concat('_', category.name);
      const hasConflict = await this.permissionRepository.exists({
        where: { name: value.name },
      });
      if (hasConflict) {
        throw new BadRequestException(
          `permission ${value.name} already exists`,
        );
      }
      value.categoryName = category.name;
    }
    return value;
  }
}
