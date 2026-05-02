import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        const redisEnabled =
          configService.get<string>('REDIS_ENABLED', 'false') === 'true';
        const redisUrl = configService.get<string>('REDIS_URL');

        return {
          stores:
            redisEnabled && redisUrl
              ? [createKeyv(redisUrl)]
              : undefined,
          ttl: configService.get<number>('CACHE_TTL', 30000),
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
})
export class ApplicationCacheModule {}
