import { User as CurrentUser } from '@app/auth/entities/user.entity';
import { ApplicationMainRoles } from '@common/enums/application-main-roles.enum';
import { AuthorizeByRoles } from '@common/decorators/authorize-by-roles.decorator';
import { Url } from '@common/decorators/url.decorator';
import { User } from '@common/decorators/user.decorator';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { SetPaginationOptionsPipe } from '@common/pipes/set-pagination-options.pipe';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { CreateBroadcastNotificationDto } from './dto/create-broadcast-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FindMyNotificationsDto } from './dto/find-my-notifications.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post('admin')
  @AuthorizeByRoles([ApplicationMainRoles.ADMIN, ApplicationMainRoles.SUPERADMIN])
  create(@Body() dto: CreateNotificationDto) {
    return this.service.create(dto);
  }

  @Post('admin/broadcast')
  @AuthorizeByRoles([ApplicationMainRoles.ADMIN, ApplicationMainRoles.SUPERADMIN])
  createBroadcast(@Body() dto: CreateBroadcastNotificationDto) {
    return this.service.createBroadcast(dto);
  }

  @Get('my')
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean, example: false })
  @ApiQuery({ name: 'type', required: false, type: String, example: 'info' })
  findMyNotifications(
    @User() user: CurrentUser,
    @Query(SetPaginationOptionsPipe) query: FindMyNotificationsDto,
    @Url() url: string,
  ) {
    return this.service.findMyNotifications(
      user,
      query as PaginationQuery<FindMyNotificationsDto>,
      url,
    );
  }

  @Get('my/unread-count')
  getMyUnreadCount(@User() user: CurrentUser) {
    return this.service.getMyUnreadCount(user);
  }

  @Patch('my/:id/read')
  markAsRead(@Param('id') id: string, @User() user: CurrentUser) {
    return this.service.markAsRead(id, user);
  }

  @Patch('my/read-all')
  markAllAsRead(@User() user: CurrentUser) {
    return this.service.markAllAsRead(user);
  }
}
