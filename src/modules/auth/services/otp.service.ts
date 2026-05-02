import { SmsService } from '@app/sms/sms.service';
import { otpExpireTime } from '@common/utils/constants.utils';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt } from 'crypto';
import { OtpSentResponse } from '../models/otp-send-response';
import { REDIS_PROVIDER } from '@common/constants/injection-tokens';
import { AuthControllerCode } from '../constants/controller-codes';

type OtpStoreClient = {
  set: (key: string, value: string, options?: { EX?: number }) => Promise<any>;
  exists: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  del: (key: string) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<number>;
};

@Injectable()
export class OtpService {
  private readonly otpAttemptsLimit = 5;
  private readonly otpSendWindowSeconds = 600;
  private readonly otpSendWindowLimit = 3;

  constructor(
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    @Inject(REDIS_PROVIDER)
    private readonly redisClient: OtpStoreClient,
  ) {}

  private generate(): string {
    const otp = randomInt(0, 1_000_000);
    return otp.toString().padStart(6, '0');
  }

  private getOtpHash(otp: string): string {
    const secret = this.configService.get<string>(
      'OTP_SECRET',
      'dev_otp_secret',
    );
    return createHmac('sha256', secret).update(otp).digest('hex');
  }

  private getOtpKey(recipient: string): string {
    return `otp:${recipient}`;
  }

  private getAttemptKey(recipient: string): string {
    return `otp:attempts:${recipient}`;
  }

  private getSendWindowKey(recipient: string): string {
    return `otp:send-window:${recipient}`;
  }

  private shouldExposeOtpInResponse(): boolean {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }

  private async checkRateLimit(recipient: string): Promise<void> {
    const sendWindowKey = this.getSendWindowKey(recipient);
    const counter = await this.redisClient.incr(sendWindowKey);
    if (counter === 1) {
      await this.redisClient.expire(sendWindowKey, this.otpSendWindowSeconds);
    }
    if (counter > this.otpSendWindowLimit) {
      throw new BadRequestException({
        code: `${AuthControllerCode}13`,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'too many request',
      });
    }
  }

  private async save(otp: string, recipient: string) {
    const otpKey = this.getOtpKey(recipient);
    const attemptKey = this.getAttemptKey(recipient);
    await this.redisClient.set(otpKey, this.getOtpHash(otp), {
      EX: otpExpireTime,
    });
    await this.redisClient.del(attemptKey);
  }

  private async send(otp: string, recipient: string): Promise<string> {
    try {
      return await this.smsService.sendOtp(recipient, otp);
    } catch {
      throw new BadRequestException({
        code: `${AuthControllerCode}14`,
        statusCode: HttpStatus.BAD_GATEWAY,
        message: 'otp provider failed',
      });
    }
  }

  private async isSent(recipient: string): Promise<boolean> {
    const result = await this.redisClient.exists(this.getOtpKey(recipient));
    return !!result;
  }

  public async verify(
    providedOtp: string,
    recipient: string,
  ): Promise<boolean> {
    const otpKey = this.getOtpKey(recipient);
    const attemptsKey = this.getAttemptKey(recipient);
    const savedOtpHash = await this.redisClient.get(otpKey);
    if (!savedOtpHash) {
      return false;
    }

    const attempts = await this.redisClient.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisClient.expire(attemptsKey, otpExpireTime);
    }
    if (attempts > this.otpAttemptsLimit) {
      await this.redisClient.del(otpKey);
      await this.redisClient.del(attemptsKey);
      return false;
    }

    const matched = this.getOtpHash(providedOtp) === savedOtpHash;
    if (!matched) {
      return false;
    }

    await this.redisClient.del(otpKey);
    await this.redisClient.del(attemptsKey);
    return true;
  }

  public async generateAndSend(recipient: string): Promise<OtpSentResponse> {
    await this.checkRateLimit(recipient);
    if (await this.isSent(recipient)) {
      throw new BadRequestException({
        code: `${AuthControllerCode}13`,
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'too many request',
      });
    }

    const otp: string = this.generate();
    await this.save(otp, recipient);
    const sendResult: string = await this.send(otp, recipient);

    return {
      message: sendResult,
      secondsToExpire: otpExpireTime,
      phoneNumber: recipient,
      otp: this.shouldExposeOtpInResponse() ? otp : undefined,
    };
  }
}
