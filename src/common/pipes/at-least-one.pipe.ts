import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AtLeastOnePipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}

  transform(value: any) {
    const hasAtLeastOneField = this.fields.some(
      (field) => value[field] !== undefined && value[field] !== null,
    );

    if (!hasAtLeastOneField) {
      throw new BadRequestException(
        `One of ${this.fields.join(' or ')} must be submitted.`,
      );
    }

    return value;
  }
}
