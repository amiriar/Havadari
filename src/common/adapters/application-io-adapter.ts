import { INestApplication, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions, Socket } from 'socket.io';
import { getSocketToken } from '@common/utils/get-socket-token';
import { User } from '@app/auth/entities/user.entity';
import { AuthService } from '@app/auth/services/auth.service';
@Injectable()
export class ApplicationIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  private readonly configService: ConfigService;
  private readonly authService: AuthService;

  constructor(
    app: INestApplication,
    configService: ConfigService,
    authService: AuthService,
  ) {
    super(app);
    this.configService = configService;
    this.authService = authService;
  }

  async connectToRedis(): Promise<void> {
    const redisEnabled =
      this.configService.get<string>('REDIS_ENABLED', 'false') === 'true';
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisEnabled || !redisUrl) {
      return;
    }

    const pubClient = createClient({
      url: redisUrl,
    });

    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      cors: {
        origin: this.configService.get<string>('AUTHORIZED_ORIGINS'),
      },
      ...options,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }

  bindClientConnect(server: any, callback: () => void): any {
    server.use(async (socket: Socket, next: (err?: Error) => void) => {
      const authToken: string = getSocketToken(socket);

      let user: User;

      try {
        user = await this.authService.authenticate(authToken);
      } catch (error) {
        return next(error);
      }

      socket.data.user = user;

      return next();
    });

    server.on('connection', callback);
  }
}
