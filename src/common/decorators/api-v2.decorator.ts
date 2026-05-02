import { SetMetadata, applyDecorators } from '@nestjs/common';
export const INACTIVE = 'inActive';
const InActiveContorller = SetMetadata('swagger/version', ['v2']);

export const Apiv2 = () => applyDecorators(InActiveContorller);
