import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class AtMostOne implements PipeTransform {
  fields: string[];

  constructor(fields: string[]) {
    this.fields = fields;
  }

  transform(dto: any) {
    let countOfExistingFilds = 0;

    this.fields.forEach((field) => {
      if (dto.hasOwnProperty(field)) {
        countOfExistingFilds++;
      }
    });

    if (countOfExistingFilds > 1) {
      throw new BadRequestException(
        'just one of ' + this.fields.toString() + ' is ' + 'allowed',
      );
    }

    return dto;
  }
}
