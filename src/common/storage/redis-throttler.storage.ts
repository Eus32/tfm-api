import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@InjectRedis() private readonly redis: Redis) {
    redis.on('error', (err) => {
          console.error('Redis error:', err);
        });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    name: string,
  ): Promise<ThrottlerStorageRecord> {
    const totalHits = await this.redis.incr(key);

    if (totalHits === 1) {
      await this.redis.expire(key, Math.ceil(ttl / 1000));
    }

    const timeToExpire = (await this.redis.ttl(key)) * 1000;
    const isBlocked = totalHits > limit;

    return {
      totalHits,
      timeToExpire,
      isBlocked,
      timeToBlockExpire: isBlocked ? timeToExpire : -1,
    };
  }

  async getRecord(key: string) {
    const value = await this.redis.get(key);
    return value ? [parseInt(value, 10)] : [];
  }
}
