import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
// import { getUserDto } from '../user/dto/get-user.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwt: JwtService) {}

  async signin(username: string, password: string) {
    const user = await this.userService.find(username);

    if (!user) {
      throw new ForbiddenException('User not exist, please signup');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new ForbiddenException('Wrong username or password');
    }

    return await this.jwt.signAsync({
      username: user.username,
      sub: user.id,
      expiresIn: 600
    });
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
