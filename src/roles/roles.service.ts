import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from './roles.entity';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Roles) private roleRepository: Repository<Roles>,
  ) { }

  async create(createRoleDto: CreateRoleDto) {

    const hasRole = await this.roleRepository.findOne({ where: { name: createRoleDto.name } });
    if (hasRole) throw new HttpException("Already exist", 500);

    const role = await this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  findAll() {
    return this.roleRepository.find();
  }

  findOne(id: number) {
    return this.roleRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne(id);
    if (!role) {
      throw new BadRequestException('Not found role')
    }
    const newRole = this.roleRepository.merge(role, updateRoleDto);
    return this.roleRepository.save(newRole);
  }

  async remove(id: number) {
    const role = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.id = :id', { id })
      .getOne()

    if (role) {
      throw new HttpException("This role is bound to a user and cannot be deleted.", 500);
    } else {
      return this.roleRepository.createQueryBuilder('roles').where("roles.id = :id", { id }).softDelete().execute()
    }
  }
}
