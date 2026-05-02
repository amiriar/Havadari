import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { generateQuryParams } from '@common/utils/generate-qury-params';

type UrlOptions = {
  excludePath?: boolean;
};

export const Url = createParamDecorator(
  (data: UrlOptions, context: ExecutionContext) => {
    const request: Request = context.switchToHttp().getRequest();
    const stripedQuery = request.query;
    delete stripedQuery.page;
    delete stripedQuery.limit;

    const path = data?.excludePath ? '' : request.path + '?';
    return `${request.protocol}://${request.get('Host')}${request.baseUrl}${path}${generateQuryParams(stripedQuery)}`;
  },
);
