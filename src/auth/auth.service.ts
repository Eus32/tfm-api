import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
// import { getUserDto } from '../user/dto/get-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { resolve } from 'node:path/win32';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwt: JwtService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    redis.on('error', (err) => {
          console.error('Redis error:', err);
        });
  }

  async signin(username: string, password: string) {
    const user = await this.userService.find(username);

    if (!user) {
      throw new ForbiddenException('User not exist, please signup');
    }

    const attempts = await this.redis.get(this.getKey(username));
    if (attempts && parseInt(attempts) >= 5) {
      throw new ForbiddenException('Too many failed attempts. Try again later.');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      await this.incrementFailedAttempts(username);
      throw new ForbiddenException('Wrong username or password');
    }

    await this.redis.del(this.getKey(username));

    return await this.jwt.signAsync({
      username: user.username,
      sub: user.id,
      expiresIn: 600,
    });
  }

  private async incrementFailedAttempts(username: string) {
    const key = this.getKey(username);
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      // Expira en 10 minutos solo si es la primera vez que se setea
      await this.redis.expire(key, 600);
    }
  }

  private getKey(username: string) {
    return `failed_auth_attempts_last_10min:${username}`;
  }

  async signup(username: string, password: string) {
    const user = await this.userService.find(username);

    if (user) {
      throw new ForbiddenException('User already exists');
    }
    const res = await this.userService.create({
      username,
      password,
    });

    return res;
  }
}
