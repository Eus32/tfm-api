import { Column, Entity, ManyToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';

import { User } from 'src/user/entities/user.entity';
// import { Menus } from 'src/menus/menu.entity';
import { Expose } from 'class-transformer';

@Entity()
export class Roles {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({
    unique: true, type: "varchar",
    length: 150,
  })
  @Expose()
  name: string;

  @ManyToMany(() => User, (user) => user.roles)
  @Expose()
  users: User[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;

  // @ManyToMany(() => Menus, (menus) => menus.role)
  // @Expose()
  // menus: Menus[];
}
