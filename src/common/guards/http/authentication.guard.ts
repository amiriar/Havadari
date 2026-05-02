import { AuthService } from '@app/auth/services/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getToken } from '@common/utils/get-token';
import { User } from '@app/auth/entities/user.entity';
import { Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const authToken = getToken(request);

    if (!authToken) throw new UnauthorizedException();

    let user: User;

    try {
      user = await this.authService.authenticate(authToken);
      request['user'] = user;
    } catch {
      return false;
    }

    return true;
  }
}
