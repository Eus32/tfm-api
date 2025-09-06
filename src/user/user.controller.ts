import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { getUserDto } from './dto/get-user.dto';
import { CreateUserPipe } from './pipes/create-user.pipe';
import { Serialize } from '../common/decorators/serialize.decorator';
import { JwtGuard } from "../common/guards/jwt.guard"
import { PublicUserDto } from './dto/public-user.dto';

@Controller('user')
@UseGuards(JwtGuard)
export class UserController {

  constructor(
    private userService: UserService
  ) {}

  @Get()
  @Serialize(PublicUserDto)
  getUsers(@Query() query: getUserDto): any {
    return this.userService.findAll(query);
  }

  @Get('/:id')
  getUser(@Param('id') id: number): any {
    return this.userService.findOne(id);
  }

  @Post()
  @Serialize(PublicUserDto)
  addUser(@Body(CreateUserPipe) dto: CreateUserDto): any {
    const user = dto as User;
    return this.userService.create(user);
  }

  @Delete('/:id')
  removeUser(@Param('id') id: number): any {
    return this.userService.remove(id);
  }


}
