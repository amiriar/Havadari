import { ConfigService } from '@nestjs/config';

export class JwtPayload {
  iis: string;
  sub: string;
  aud: string;
  iat: number;
  sid: string;

  constructor(sub: string, sid: string, configService: ConfigService) {
    this.sub = sub;
    this.sid = sid;
    const base_url = configService.get<string>('base_url');
    this.iis = base_url;
    this.aud = base_url;
    this.iat = new Date().getTime() / 1000;
  }
}
