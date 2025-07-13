import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book) private bookRepository: Repository<Book>,
  ) {}

  create(createBookDto: CreateBookDto) {
    const createdUserData = this.bookRepository.save(createBookDto);
    return createdUserData;
  }

  async findAll() {
    let queryBuilder = this.bookRepository.createQueryBuilder('book');
    const result = queryBuilder.getMany();
    return result;
  }

  async findOne(id: number) {
    let book = await this.bookRepository.findOne({
      where: { id },
    });
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto) {
    const book = await this.findOne(id);
    if (!book) {
      throw new BadRequestException('Not found book');
    }
    const newBook = this.bookRepository.merge(book, updateBookDto);
    return this.bookRepository.save(newBook);
  }

  remove(id: number) {
    return this.bookRepository.delete(id);
  }
}
