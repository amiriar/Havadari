import { IsOptional, IsString } from 'class-validator';
import { IsDateOnly } from '@common/validators';
import { IsFutureDate } from '@common/validators/is-future-date-constraint';
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateOnly()
  @IsFutureDate()
  expireDate?: Date;
}
