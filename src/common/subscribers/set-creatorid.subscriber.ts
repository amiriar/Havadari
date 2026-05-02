import { RequestContextService } from '@common/services/request-context.service';
import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class CreatorIdSubscriber implements EntitySubscriberInterface {
  beforeInsert(event: InsertEvent<any>): Promise<any> | void {
    if (event.entity) {
      event.entity.creatorId = RequestContextService.getInstance()?.getUserId();
    }
  }
}
