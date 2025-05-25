import { Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({
    unique: true,
    type: 'varchar',
    length: 150,
  })
  @Expose()
  title: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 150,
  })
  @Expose()
  author: string;

  @Column({
    unique: true,
    type: 'varchar',
    length: 150,
  })
  @Expose()
  publisher: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date;
}
