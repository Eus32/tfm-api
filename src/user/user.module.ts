import { Global, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Profile } from "./profile.entity"
import { CreateUserTransaction } from "./transaction/create-user.transaction"


@Global()
@Module({
    imports: [TypeOrmModule.forFeature([User, Profile])],
    controllers: [UserController],
    providers: [UserService, CreateUserTransaction],
    exports: [UserService],
})
export class UserModule { }
