import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class VerifyUserDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isEmailVerified: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isPhoneVerified: boolean;
}
