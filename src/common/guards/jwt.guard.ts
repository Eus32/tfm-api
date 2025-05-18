import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractJwt } from 'passport-jwt';
import { verify, TokenExpiredError } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { ConfigEnum } from '../../config/enum';
import { InjectRedis } from '@nestjs-modules/ioredis';

export class JwtGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRedis() private readonly redis: any,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // custom logic can go here
    const request = context.switchToHttp().getRequest();
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    // const cacheToken = this.redis.get(token);
    try {
      if (!token) {
        throw new UnauthorizedException('Invalid Token!');
      }

      const secret = this.configService.get(ConfigEnum.SECRET)

      const payload: any = await verify(
        token,
        secret
      );

      const username = payload.username
      const tokenCache = username ? await this.redis.get(username) : null;
      if (!payload || !username || tokenCache !== token) {
        throw new UnauthorizedException('Invalid Token!!!');
      }

      const parentCanActivate = (await super.canActivate(context)) as boolean; // this is necessary due to possibly returning `boolean | Promise<boolean> | Observable<boolean>
      // custom logic goes here too
      return parentCanActivate;

    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Expired Token!');
      }
      throw error
    }

  }
}

