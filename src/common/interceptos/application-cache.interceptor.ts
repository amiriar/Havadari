import { Injectable, NestInterceptor, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { NO_CACHE_METADATA } from '@common/constants/keys';

@Injectable()
export class ApplicationCacheInterceptor
  extends CacheInterceptor
  implements NestInterceptor
{
  constructor(cacheManager: Cache, reflector: Reflector) {
    super(cacheManager, reflector);
  }

  trackBy(context: ExecutionContext): string | undefined {
    const noCache = this.reflector.get<boolean>(
      NO_CACHE_METADATA,
      context.getHandler(),
    );

    if (noCache) {
      return;
    }

    return super.trackBy(context);
  }
}
