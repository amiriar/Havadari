import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type DefaultResponse<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  error: any | null;
};

@Injectable()
export class DefaultResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response?.statusCode ?? 200;

    return next.handle().pipe(
      map((data: any): DefaultResponse<any> | any => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data &&
          'data' in data &&
          'error' in data
        ) {
          return data;
        }

        return {
          success: true,
          statusCode,
          data,
          error: null,
        };
      }),
    );
  }
}
