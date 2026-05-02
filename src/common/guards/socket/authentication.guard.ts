import { AuthService } from '@app/auth/services/auth.service';
import { getSocketToken } from '@common/utils/get-socket-token';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsArgumentsHost } from '@nestjs/common/interfaces';
import { Socket } from 'socket.io';
import { User } from '@app/auth/entities/user.entity';
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const wsContext: WsArgumentsHost = context.switchToWs();

    const client: Socket = wsContext.getClient();

    const authToken = getSocketToken(client);

    let user: User;

    try {
      user = await this.authService.authenticate(authToken);
      client.data.user = user;
    } catch {
      client.emit('AUTHENTICATION_ERROR', { message: 'Unuthorized' });
      client.disconnect();
      return false;
    }

    return true;
  }
}
