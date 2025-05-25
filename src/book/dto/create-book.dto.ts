import { IsDate, IsDateString, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateBookDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 64)
  author: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 64)
  publisher: string;
}
