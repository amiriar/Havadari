import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty({ required: false, description: 'Target user id' })
  @IsOptional()
  @IsUUID('4')
  toUserId?: string;

  @ApiProperty({ required: false, description: 'Target username' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  toUserName?: string;
}
