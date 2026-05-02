import { PaginatedResponse } from '@common/dto/paginated.dto';
import { User } from '../entities/user.entity';

export class UserPaginatedResopnse extends PaginatedResponse {
  items: User[];
}
