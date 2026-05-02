import { IPaginationOptions } from 'nestjs-typeorm-paginate';

export class PaginationQuery<T> {
  data: T;
  paginationOptions: IPaginationOptions;
}
