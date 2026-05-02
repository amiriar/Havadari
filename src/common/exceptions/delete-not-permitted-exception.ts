import { HttpException, HttpStatus } from '@nestjs/common';

export class DeleteNotPermitedException extends HttpException {
  constructor(message = 'delete is not allowed', code = '') {
    super(
      { message: message, code: code, statusCode: HttpStatus.NOT_ACCEPTABLE },
      HttpStatus.NOT_ACCEPTABLE,
    );
  }
}
