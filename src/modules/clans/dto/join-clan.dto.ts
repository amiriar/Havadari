import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class JoinClanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID('4')
  clanId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  inviteCode?: string;
}
