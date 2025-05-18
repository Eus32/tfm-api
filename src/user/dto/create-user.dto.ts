import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20, {
    message: `Length should be bwtween $constraint1 $constraint2 Current value: $value`,
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 64)
  password: string;

}
