import { IsDateOnly } from '@common/validators';
import { IsFutureDate } from '@common/validators/is-future-date-constraint';
import { NotExists } from '@common/validators/not-exists-constraint';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '../entities/role.entity';
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @NotExists(Role)
  name: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  guardName?: string;

  @IsOptional()
  @IsDateOnly()
  @IsFutureDate()
  expireDate?: Date;
}
