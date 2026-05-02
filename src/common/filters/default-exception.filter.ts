import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { localizeErrorMessage, tError } from '@common/messages/error-translator';

@Catch()
export class DefaultExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawError =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode,
            message: tError(
              'errors.internal_server_error',
              undefined,
              'Internal server error',
            ),
          };

    const localizedError =
      typeof rawError === 'string'
        ? localizeErrorMessage(rawError)
        : this.localizeErrorPayload(rawError);

    response.status(statusCode).json({
      success: false,
      statusCode,
      data: null,
      error: localizedError,
    });
  }

  private localizeErrorPayload(error: unknown): unknown {
    if (typeof error === 'string') {
      return localizeErrorMessage(error);
    }

    if (Array.isArray(error)) {
      return error.map((item) => this.localizeErrorPayload(item));
    }

    if (!error || typeof error !== 'object') {
      return error;
    }

    const payload = { ...(error as Record<string, unknown>) };

    if (typeof payload.message === 'string') {
      payload.message = localizeErrorMessage(payload.message);
    }

    if (Array.isArray(payload.messages)) {
      payload.messages = payload.messages.map((message) =>
        typeof message === 'string' ? localizeErrorMessage(message) : message,
      );
    }

    if (typeof payload.error === 'string') {
      payload.error = localizeErrorMessage(payload.error);
    }

    return payload;
  }
}
