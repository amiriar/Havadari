import { PaginationDto } from '@common/dto';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { PipeTransform } from '@nestjs/common';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';

export class SetPaginationOptionsPipe implements PipeTransform {
  transform(dto: PaginationDto): PaginationQuery<any> {
    if (!dto.page) {
      dto.page = 1;
    }
    if (!dto.limit) {
      dto.limit = 10;
    }

    const pagination: IPaginationOptions = {
      page: parseInt(dto.page.toString()),
      limit: parseInt(dto.limit.toString()),
    };

    delete dto.page;
    delete dto.limit;
    delete dto.path;
    delete dto.noCache;
    delete dto.nocache;

    return {
      data: dto,
      paginationOptions: pagination,
    };
  }
}
