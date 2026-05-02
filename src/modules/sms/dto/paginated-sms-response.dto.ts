import { ApiProperty } from '@nestjs/swagger';
import { SmsEntity } from '../entities/sms.entity';
import { PaginatedResponse } from '@common/dto/paginated.dto';
export class PaginatedSmsResponse extends PaginatedResponse {
  @ApiProperty({ type: [SmsEntity] })
  data: SmsEntity[];
}
