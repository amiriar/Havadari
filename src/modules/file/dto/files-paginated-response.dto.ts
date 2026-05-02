import { PaginatedResponse } from '@common/dto/paginated.dto';
import { File } from '../entities/file.entity';

export class FilesPaginatedResponseDto extends PaginatedResponse {
  items: File[];
}
