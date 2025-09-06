import {
  Module,
  Logger,
  Global,
  NestModule,
  MiddlewareConsumer,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis';

import DailyRotateFile = require('winston-daily-rotate-file');

import { buildConnectionOptions, validationSchema } from './config/TypeOrm';
import { ConfigEnum } from './config/enum';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { BookModule } from './book/book.module';
import { RequestLoggerMiddleware } from './common/interceptors/logger.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './common/storage/redis-throttler.storage';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/throttle.guard';
const envFilePath = `.env.${process.env.NODE_ENV || `development`}`;

const format = winston.format;

Global();
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      //envFilePath,
      load: [
        () => {
          const values = dotenv.config({ path: '.env' });
          const { error } = validationSchema.validate(values?.parsed, {
            allowUnknown: true,
            abortEarly: false,
          });
          if (error) {
            throw new Error(
              `Validation failed - Is there an environment variable missing?
        ${error.message}`,
            );
          }
          return values;
        },
      ],
      validationSchema,
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const host = configService.get(ConfigEnum.REDIS_HOST);
        const port = configService.get(ConfigEnum.REDIS_PORT);
        const password = configService.get(ConfigEnum.REDIS_PASSWORD);
        const url = password
          ? `redis://default:${password}@${host}:${port}`
          : `redis://${host}:${port}`;
        return {
          url,
          type: 'single',

          options: {
            reconnectOnError: (err: any) => {
              return true;
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot(
      buildConnectionOptions(),
    ),
    WinstonModule.forRoot({
      exitOnError: false,
      format: format.combine(
        format.timestamp({
          format: 'HH:mm:ss YY/MM/DD',
        }),
        format.label({
          label: 'tfm-eus',
        }),
        format.splat(),
        format.printf((info) => {
          return `${info.timestamp} [${info.level}]: ${JSON.stringify(info.message)}`;
        }),
      ),
      transports: [
        new winston.transports.Console({
          level: 'info',
        }),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [getRedisConnectionToken()],
      useFactory: (redis: Redis) => {
        redis.on('error', (err) => {
          console.error('Redis error:', err);
        });
        return {
          throttlers: [{ limit: 3, ttl: 60 }],
          storage: new RedisThrottlerStorage(redis),
        };
      },
    }),
    UserModule,
    AuthModule,
    RolesModule,
    BookModule,
  ],
  controllers: [],
  providers: [
    Logger,
    RedisThrottlerStorage,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
  exports: [Logger, RedisModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
