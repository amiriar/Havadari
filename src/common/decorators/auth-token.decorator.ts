import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { getToken } from '../utils/get-token';

export const AuthToken = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();

    return getToken(request);
  },
);
