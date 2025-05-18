import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  HttpException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninUserDto } from './dto/signin-user.dto';
import { SerializeInterceptor } from 'src/common/interceptors/serialize.interceptor';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectRedis() private readonly redis: any,
  ) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Post('/signin')
  async signin(@Body() dto: SigninUserDto) {
    const { username, password } = dto;
    const token = await this.authService.signin(username, password);
    await this.redis.set(username, token);
    return {
      access_token: token,
    };
  }

  @Post('/signup')
  @UseInterceptors(new SerializeInterceptor<SigninUserDto>(SigninUserDto))
  signup(@Body() dto: SigninUserDto) {
    const { username, password } = dto;
    if (!username || !password) {
      console.log('1')
      throw new HttpException('', 400);
    }
    if (typeof username !== 'string' || typeof password !== 'string') {
      console.log('2')
      throw new HttpException('', 400);
    }
    if (
      !(typeof username == 'string' && username.length >= 6) ||
      !(typeof password === 'string' && password.length >= 6)
    ) {
      console.log('3')
      throw new HttpException('', 400);
    }
    return this.authService.signup(username, password);
  }
}
