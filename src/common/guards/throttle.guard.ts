import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorageService,
} from '@nestjs/throttler';
import { RedisThrottlerStorage } from '../storage/redis-throttler.storage';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    reflector: Reflector,
    private readonly redisStorageService: RedisThrottlerStorage,
  ) {
    super(options, redisStorageService, reflector);
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const {
      context,
      limit,
      ttl,
      throttler,
      blockDuration,
      getTracker,
      generateKey,
    } = requestProps;

    const req = context.switchToHttp().getRequest();

    const tracker = await getTracker(
      context.switchToHttp().getRequest(),
      context,
    );
    const key = generateKey(
      context,
      tracker,
      throttler?.name || 'throttle-name',
    );
    const { totalHits, timeToExpire, isBlocked } =
      await this.redisStorageService.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttler?.name || 'throttle-name',
      );

    // Guardar datos útiles en la request
    req.throttleInfo = {
      totalHits,
      limit,
      ttl,
      timeToExpire,
      isBlocked,
      remaining: Math.max(limit - totalHits, 0),
    };

    if (isBlocked) {
      await this.throwThrottlingException(context, {
        limit,
        ttl,
        key,
        tracker,
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: timeToExpire
      });
    }

    return true;
  }
}
