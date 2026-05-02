import { NotificationType } from '@app/notification/enums/notification-type.enum';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBroadcastNotificationDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  link?: string;
}
