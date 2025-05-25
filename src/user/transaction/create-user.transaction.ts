import { EntityManager, DataSource } from 'typeorm';
import { Injectable, HttpException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BaseTransaction } from "../../common/typeorm/BaseTransaction"
import { User } from '../entities/user.entity';
import { Profile } from "../profile.entity";

@Injectable()
export class CreateUserTransaction extends BaseTransaction<Partial<User>, User> {
    constructor(dataSource: DataSource) {
        super(dataSource);
    }

    // the important thing here is to use the manager that we've created in the base class
    protected async execute(data: Partial<User>, manager: EntityManager): Promise<User> {
        const hasUser = await manager.findOneBy("user", { username: data.username })
        if (hasUser) throw new HttpException("The user already exists", 500);

        const profile = Object.assign(new Profile(), {
            gender: 1,
            photo: 'https://1111',
            address: ""
        })
        await manager.save(profile)

        const role = await manager.findOne("roles", { where: { name: "Admin" } });


        data.password = await argon2.hash(data.password || '');
        const createUser = Object.assign(new User(), data)
        createUser.profile = profile


        if (role) {
            // @ts-expect-error
            createUser.roles = [role]
        }

        const newUser = await manager.save(createUser)


        return newUser
    }

}