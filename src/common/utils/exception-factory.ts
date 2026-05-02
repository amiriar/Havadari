import { BadRequestException } from '@nestjs/common';
import { getValidationMessages } from './get-validation-message';
import { HttpStatus } from '@nestjs/common';
import { ValidationError } from '@nestjs/common';
import {
  localizeErrorMessage,
  tError,
} from '@common/messages/error-translator';

export function exceptionFactory(errors: ValidationError[]) {
  const messages = [];

  errors.forEach((error) => {
    messages.push(...getValidationMessages(error));
  });

  return new BadRequestException({
    code: 'VALIDATION_FAILED',
    statusCode: HttpStatus.BAD_REQUEST,
    error: tError('errors.bad_request', undefined, 'Bad Request'),
    messages: messages.map((message) => localizeErrorMessage(message)),
  });
}
