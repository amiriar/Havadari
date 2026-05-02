import { ApiBody } from '@nestjs/swagger';

export const ApiFiles = (field: string): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    return ApiBody({
      schema: {
        type: 'object',
        properties: {
          [field]: {
            type: 'array',
            items: { type: 'file', format: 'binary' },
          },
        },
      },
    })(target, propertyKey, descriptor);
  };
};
