import { APPOINTMENT_UPDATE } from '@common/constants/events';
import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { map, Observable } from 'rxjs';

@Injectable()
export class UpdateAppointmentInterCeptor implements NestInterceptor {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((appointment) => {
        this.eventEmitter.emit(APPOINTMENT_UPDATE, appointment.id);
        return appointment;
      }),
    );
  }
}
