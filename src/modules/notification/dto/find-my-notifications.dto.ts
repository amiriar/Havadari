import { PaginationDto } from '@common/dto';
import { NotificationType } from '../enums/notification-type.enum';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class FindMyNotificationsDto extends PaginationDto {
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;
}
