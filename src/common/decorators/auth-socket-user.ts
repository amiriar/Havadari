import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';

export const AuthSocketUser = createParamDecorator(
  (data, context: ExecutionContext) => {
    const client: Socket = context.switchToWs().getClient();

    return client.data.user;
  },
);
