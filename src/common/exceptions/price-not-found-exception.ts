import { HttpException, HttpStatus } from '@nestjs/common';

export class PriceNotFoundException extends HttpException {
  constructor(
    message = 'unable to find price (tariff) for some {treatment-category,insurance-category} pair, please insert prices (tariffs)',
  ) {
    super(message, HttpStatus.NOT_FOUND);
  }
}
