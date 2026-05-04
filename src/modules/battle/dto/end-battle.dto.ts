import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class EndBattleDto {
  @ApiProperty()
  @IsUUID('4')
  battleId: string;
}
