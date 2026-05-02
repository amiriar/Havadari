import { PaginatedResponse } from '@common/dto/paginated.dto';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class PaginatedFindAllUsersByRolenameResponse extends PaginatedResponse {
  @ApiProperty({ type: [User] })
  data: User[];
}
