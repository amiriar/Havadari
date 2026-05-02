import { PipeTransform, Injectable } from '@nestjs/common';
import { HashingUtil } from '../utills/hasing-util';

@Injectable()
export class HashPasswordPipe implements PipeTransform {
  async transform(value: any) {
    if (value.password) {
      value.password = await HashingUtil.hash(value.password);
    }

    if (value?.userInfo?.password) {
      value.userInfo.password = await HashingUtil.hash(value.userInfo.password);
    }

    return value;
  }
}
