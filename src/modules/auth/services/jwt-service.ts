import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../models/jwt-payload';
import { REFRESH_TOKEN_EXPIRE_TIME } from 'src/common/utils/constants.utils';
import { LoginResponse } from '../models/login-response';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtService {
  constructor(
    private readonly configService: ConfigService,
    private readonly NestJwtService: NestJwtService,
  ) {}

  async signRefreshToken(userId: string) {
    const payload: JwtPayload = new JwtPayload(userId, this.configService);
    const strPayload = JSON.stringify(payload);
    const parsedPayload = JSON.parse(strPayload);
    const token = this.NestJwtService.signAsync(parsedPayload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: REFRESH_TOKEN_EXPIRE_TIME,
    });

    return token;
  }

  async signAccessToken(userId: string) {
    const paylod: JwtPayload = new JwtPayload(userId, this.configService);
    const strPayload = JSON.stringify(paylod);
    const parsedPayload = JSON.parse(strPayload);
    const token: string = await this.NestJwtService.signAsync(parsedPayload);
    return token;
  }

  async signToken(userId: string): Promise<LoginResponse> {
    const accessToken = await this.signAccessToken(userId);
    const refreshToken = await this.signRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      const payload: JwtPayload = await this.NestJwtService.verifyAsync(token, {
        ignoreExpiration: false,
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload: JwtPayload = this.NestJwtService.verify(token);

      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
