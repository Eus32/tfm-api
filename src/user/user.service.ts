import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getUserDto } from './dto/get-user.dto';
import { CreateUserTransaction } from "./transaction/create-user.transaction"


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly createUserTransaction: CreateUserTransaction
  ) { }

  findAll(query: getUserDto) {
    const { limit, page, username } = query;
    const take = limit || 10;
    const skip = ((page || 1) - 1) * take;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user').leftJoinAndSelect('user.profile', 'profile').leftJoinAndSelect('user.roles', 'roles')

    if (username) {
      queryBuilder = queryBuilder.where("user.username like :name", { name: `%${username}%` })
    }

    const result = queryBuilder
      .take(take)
      .skip(skip)
      .getMany()

    return result
  }

  find(username: string) {
    return this.userRepository.findOne({
      relations: ['roles'],
      where: { username }
    });
  }

  findOne(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(user: Partial<User>) {
    const createdUserData = await this.createUserTransaction.run(user);
    return createdUserData;
  }

  async remove(id: number) {
    return this.userRepository.delete(id);
  }
}
