import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ExactOnePipe implements PipeTransform {
  constructor(private readonly fields: string[]) {}

  transform(value: any) {
    const existingFields = this.fields.filter((field) => {
      return value[field] !== undefined && value[field] !== null;
    });
    if (existingFields.length === 0) {
      throw new BadRequestException(
        `Exactly one of ${this.fields.join(' or ')} must be submitted.`,
      );
    }

    if (existingFields.length > 1) {
      throw new BadRequestException(
        `Only one of ${this.fields.join(' or ')} is allowed.`,
      );
    }

    return value;
  }
}
