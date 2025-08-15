import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfigEnum } from 'src/config/enum';
import { JwtStrategy } from './auth.strategy';
import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [
    UserModule,
    PassportModule,
    RedisModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // console.log({
        //   secret: configService.get<string>(ConfigEnum.SECRET),
        // });
        return {
          secret: configService.get<string>(ConfigEnum.SECRET),
          signOptions: {
            expiresIn: '1d',
          },
        };
      },
      inject: [ConfigService, getRedisConnectionToken()],
    })
  ],
  providers: [AuthService, JwtStrategy, Redis],
  controllers: [AuthController]
})
export class AuthModule { }
