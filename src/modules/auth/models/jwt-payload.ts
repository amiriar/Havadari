import { ConfigService } from '@nestjs/config';

export class JwtPayload {
  iis: string;
  sub: string;
  aud: string;
  iat: number;

  constructor(sub: string, configService: ConfigService) {
    this.sub = sub;
    const base_url = configService.get<string>('base_url');
    this.iis = base_url;
    this.aud = base_url;
    this.iat = new Date().getTime() / 1000;
  }
}
