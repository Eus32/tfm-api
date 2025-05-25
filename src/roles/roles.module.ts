import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Roles } from './entities/roles.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User,Roles])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule { }
