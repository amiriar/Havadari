import { INVOICE_UPDATE } from '@common/constants/events';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { map, Observable } from 'rxjs';

@Injectable()
export class UpdateInvoiceInterCeptor implements NestInterceptor {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((invoice) => {
        this.eventEmitter.emit(INVOICE_UPDATE, invoice);
        return invoice;
      }),
    );
  }
}
