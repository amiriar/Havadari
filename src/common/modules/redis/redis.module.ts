import { REDIS_PROVIDER } from '@common/constants/injection-tokens';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

class InMemoryRedisClient {
  private readonly store = new Map<
    string,
    { value: string; expiresAt?: number }
  >();
  private readonly counters = new Map<
    string,
    { value: number; expiresAt?: number }
  >();

  async set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<'OK'> {
    const expiresAt =
      options?.EX && options.EX > 0
        ? Date.now() + options.EX * 1000
        : undefined;

    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const record = this.store.get(key);
    if (!record) {
      return null;
    }

    if (record.expiresAt && record.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    return record.value;
  }

  async exists(key: string): Promise<number> {
    const value = await this.get(key);
    return value ? 1 : 0;
  }

  async del(key: string): Promise<number> {
    const existedInStore = this.store.delete(key);
    const existedInCounters = this.counters.delete(key);
    return existedInStore || existedInCounters ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const record = this.counters.get(key);
    if (!record || (record.expiresAt && record.expiresAt <= Date.now())) {
      this.counters.set(key, { value: 1 });
      return 1;
    }
    record.value += 1;
    this.counters.set(key, record);
    return record.value;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const expiresAt = Date.now() + seconds * 1000;
    const valueRecord = this.store.get(key);
    if (valueRecord) {
      this.store.set(key, { ...valueRecord, expiresAt });
      return 1;
    }
    const counterRecord = this.counters.get(key);
    if (counterRecord) {
      this.counters.set(key, { ...counterRecord, expiresAt });
      return 1;
    }
    return 0;
  }
}

@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          inject: [ConfigService],
          provide: REDIS_PROVIDER,
          useFactory: async (configService: ConfigService) => {
            const redisEnabled =
              configService.get<string>('REDIS_ENABLED', 'false') === 'true';
            const redisUrl = configService.get<string>('REDIS_URL');

            if (!redisEnabled || !redisUrl) {
              Logger.warn(
                'Redis is disabled. Falling back to in-memory OTP store.',
                'Redis Module',
              );
              return new InMemoryRedisClient();
            }

            return createClient({
              url: redisUrl,
            })
              .on('error', () => {
                Logger.error('redis connection Error', 'Redis Module');
              })
              .on('connect', () => {
                Logger.log('redis client connected', 'Redis Module');
              })
              .connect();
          },
        },
      ],
      exports: [REDIS_PROVIDER],
      global: true,
    };
  }
}
