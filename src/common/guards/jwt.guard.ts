import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '../../config/enum';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    redis.on('error', (err) => {
          console.error('Redis error:', err);
        });
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    try {
      if (!token) {
        throw new UnauthorizedException('Missing Token');
      }

      const secret = this.configService.get(ConfigEnum.SECRET);

      const payload: any = await verify(token, secret);

      const username = payload.username;
      const tokenCache = username ? await this.redis.get(username) : null;
      if (!payload || !username || tokenCache !== token) {
        throw new UnauthorizedException('Invalid Token');
      }

      const parentCanActivate = (await super.canActivate(context)) as boolean;
      return parentCanActivate;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Expired Token!');
      }
      throw error;
    }
  }
}
