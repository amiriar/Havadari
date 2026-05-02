import { User } from '@app/auth/entities/user.entity';
import { PaginationQuery } from '@common/dto/pagination-input-query';
import { notFoundTemplate } from '@common/messages/en/templates/errors/not-found.template';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { CreateBroadcastNotificationDto } from './dto/create-broadcast-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { FindMyNotificationsDto } from './dto/find-my-notifications.dto';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    return await this.notificationRepo.save(
      this.notificationRepo.create({
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        link: dto.link,
      }),
    );
  }

  async createBroadcast(
    dto: CreateBroadcastNotificationDto,
  ): Promise<NotificationEntity> {
    return await this.notificationRepo.save(
      this.notificationRepo.create({
        title: dto.title,
        message: dto.message,
        type: dto.type,
        link: dto.link,
      }),
    );
  }

  async findMyNotifications(
    user: User,
    query: PaginationQuery<FindMyNotificationsDto>,
    url: string,
  ): Promise<Pagination<NotificationEntity>> {
    const whereBase: FindOptionsWhere<NotificationEntity>[] = [
      { userId: user.id },
      { userId: IsNull() },
    ];

    const where = whereBase.map((item) => ({
      ...item,
      ...(query.data.type ? { type: query.data.type } : {}),
      ...(query.data.isRead !== undefined ? { isRead: query.data.isRead } : {}),
    }));

    return await paginate(
      this.notificationRepo,
      {
        ...query.paginationOptions,
        route: url,
      },
      {
        where,
        order: { createdAt: 'DESC' },
      },
    );
  }

  async getMyUnreadCount(user: User): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepo.count({
      where: [
        { userId: user.id, isRead: false },
        { userId: IsNull(), isRead: false },
      ],
    });

    return { unreadCount };
  }

  async markAsRead(id: string, user: User): Promise<NotificationEntity> {
    const notification = await this.findMineOrFail(id, user);

    notification.isRead = true;
    notification.readAt = new Date();

    return await this.notificationRepo.save(notification);
  }

  async markAllAsRead(user: User): Promise<{ updated: number }> {
    const unread = await this.notificationRepo.find({
      where: [
        { userId: user.id, isRead: false },
        { userId: IsNull(), isRead: false },
      ],
    });

    unread.forEach((notification) => {
      notification.isRead = true;
      notification.readAt = new Date();
    });

    if (unread.length > 0) {
      await this.notificationRepo.save(unread);
    }

    return { updated: unread.length };
  }

  private async findMineOrFail(
    id: string,
    user: User,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationRepo.findOne({
      where: [
        { id, userId: user.id },
        { id, userId: IsNull() },
      ],
    });

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIF_404',
        statusCode: HttpStatus.NOT_FOUND,
        message: notFoundTemplate({ entity: 'Notification' }),
      });
    }

    return notification;
  }
}
