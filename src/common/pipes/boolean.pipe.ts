import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class BooleanPipe implements PipeTransform {
  transform(value: object) {
    Object.keys(value).forEach((key) => {
      if (typeof value[key] === 'object' && value[key] !== null) {
        this.transform(value[key]);
      }

      if (value[key] == 'true') value[key] = 1;

      if (value[key] == 'false') value[key] = 0;
    });

    return value;
  }
}
