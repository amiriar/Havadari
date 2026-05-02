import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(message = 'Request limit exceeded. Please try again later.') {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
