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
import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { getUserDto } from './dto/get-user.dto';
import { CreateUserPipe } from './pipes/create-user.pipe';
import { Serialize } from '../common/decorators/serialize.decorator';
import { JwtGuard } from "../common/guards/jwt.guard"
import { PublicUserDto } from './dto/public-user.dto';

@Controller('user')
// @UseFilters(new TypeormFilter())
@UseGuards(JwtGuard)
export class UserController {
  // private logger = new Logger(UserController.name);

  constructor(
    private userService: UserService
  ) {
    // this.logger.log('UserController init');
  }

  @Get()
  @Serialize(PublicUserDto)
  getUsers(@Query() query: getUserDto): any {
    return this.userService.findAll(query);
  }


  @Get('/:id')
  getUser(): any {
    return 'hello world';
    // return this.userService.getUsers();
  }


  @Post()
  @Serialize(PublicUserDto)
  addUser(@Body(CreateUserPipe) dto: CreateUserDto): any {
    const user = dto as User;
    return this.userService.create(user);
  }

  @Delete('/:id') // RESTfull Method
  removeUser(@Param('id') id: number): any {
    return this.userService.remove(id);
  }


}
