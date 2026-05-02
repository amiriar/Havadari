import { Injectable, PipeTransform } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto';
@Injectable()
export class PaginationDefaultsPipe implements PipeTransform {
  transform(value: PaginationDto) {
    const result = {
      page: parseInt(value.page?.toString()),
      limit: parseInt(value.limit?.toString()),
      path: value.path,
      ...value,
    };

    if (!result.page) {
      result.page = 1;
    }
    if (!result.limit) {
      result.limit = 10;
    }

    delete value.path;
    delete value.page;
    delete value.limit;

    return result;
  }
}
