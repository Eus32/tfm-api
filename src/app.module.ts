import { Module, Logger, LoggerService, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as dotenv from 'dotenv';
import { RedisModule } from '@nestjs-modules/ioredis';

import DailyRotateFile = require('winston-daily-rotate-file');

import { buildConnectionOptions, validationSchema } from './config/TypeOrm';
import { ConfigEnum } from './config/enum';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
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
    // Redis
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService, logger: LoggerService) => {
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
              // logger.error(`Redis Connection error: ${err}`);
              return true;
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot( // Import ConfigModule to access ConfigService
       buildConnectionOptions(), // Pass the typeOrmConfig function as the factory
    ),
    WinstonModule.forRoot({
      exitOnError: false,
      format: format.combine(
        format.colorize(),
        format.timestamp({
          format: 'HH:mm:ss YY/MM/DD',
        }),
        format.label({
          label: 'tfm-eus',
        }),
        format.splat(),
        format.printf((info) => {
          return `${info.timestamp} ${info.level}: [${info.label}]${JSON.stringify(info.message)}`;
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
    UserModule,
    AuthModule,
    RolesModule,
  ],
  controllers: [],
  providers: [
    Logger
  ],
  exports: [Logger],
})
export class AppModule {}
