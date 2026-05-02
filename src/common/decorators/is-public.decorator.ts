import { SetMetadata, applyDecorators } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
const PublicAuthMiddleware = SetMetadata(IS_PUBLIC_KEY, true);
const PublicAuthSwagger = SetMetadata('swagger/apiSecurity', ['isPublic']);

export const IsPublic = () =>
  applyDecorators(PublicAuthMiddleware, PublicAuthSwagger);
