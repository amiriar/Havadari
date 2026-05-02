import { ApplicationBaseEntity } from '@common/entities/application-base.entity';
import { getLasHour } from '@common/utils/date-utills/get-last-hour';
import { deepMerge } from '@common/utils/deep-merge';
import { ForbiddenException } from '@nestjs/common';
import { MoreThanOrEqual, Repository } from 'typeorm';

export abstract class BaseService {
  protected repository: Repository<ApplicationBaseEntity>;

  async getRecent() {
    return await this.repository.find({
      where: { createdAt: MoreThanOrEqual(getLasHour()) },
    });
  }

  async updateRecent(id: string, body: any, userId: string) {
    const entity: ApplicationBaseEntity = await this.repository.findOne({
      where: {
        createdAt: MoreThanOrEqual(getLasHour()),
        id: id,
        creatorId: userId,
      },
    });

    if (!entity) {
      throw new ForbiddenException(
        'the editing deadline has expired, or you are not owner',
      );
    }

    return await this.repository.save(deepMerge(entity, body));
  }

  async removeRecent(id: string, userId: string) {
    const entity: ApplicationBaseEntity = await this.repository.findOne({
      where: {
        createdAt: MoreThanOrEqual(getLasHour()),
        id: id,
        creatorId: userId,
      },
    });
    if (!entity) {
      throw new ForbiddenException(
        'the deleting deadline has expired, or you are not owner',
      );
    }
    return await this.repository.remove(entity);
  }

  async softRemoveRecent(id: string, userId: string) {
    const entity: ApplicationBaseEntity = await this.repository.findOne({
      where: {
        createdAt: MoreThanOrEqual(getLasHour()),
        id: id,
        creatorId: userId,
      },
    });
    if (!entity) {
      throw new ForbiddenException(
        'the deleting deadline has expired, or you are not owner',
      );
    }
    return await this.repository.softRemove(entity);
  }
}
