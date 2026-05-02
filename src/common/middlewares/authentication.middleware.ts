import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { getToken } from '../utils/get-token';
import { User } from 'src/modules/auth/entities/user.entity';
import { AuthService } from '@app/auth/services/auth.service';
import { RequestContextService } from '@common/services/request-context.service';

@Injectable()
export class AuthenticationMiddleWare implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly requestContext: RequestContextService,
  ) {}

  async use(req: Request, res: Response, next: (error?: Error | any) => void) {
    const authToken: string = getToken(req);

    if (!authToken) {
      next();
      return;
    }

    try {
      const user: User = await this.authService.authenticate(authToken);
      req['user'] = user;
      this.requestContext.setUser(user);
      next();
      return;
    } catch {
      // Optional auth middleware: invalid/expired token should not block public routes.
      next();
      return;
    }
  }

}
