import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PlayRoundDto {
  @ApiProperty()
  @IsUUID('4')
  battleId: string;
}
