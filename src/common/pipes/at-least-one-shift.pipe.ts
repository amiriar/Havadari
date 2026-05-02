import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AtLeastOneShiftPipe implements PipeTransform {
  transform(value: any) {
    const { startTime_1, endTime_1, startTime_2, endTime_2 } = value;
    console.log(value);
    const firstIsFull = startTime_1 && endTime_1;
    const secondIsFull = startTime_2 && endTime_2;

    if (!firstIsFull && !secondIsFull) {
      throw new BadRequestException('Enter at least one shift');
    }

    return value;
  }
}
