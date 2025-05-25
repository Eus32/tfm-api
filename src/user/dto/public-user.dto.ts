import { Exclude, Expose } from 'class-transformer';
import { Roles } from 'src/roles/entities/roles.entity';
import { Profile } from '../profile.entity';


export class PublicUserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  profile: Profile;

  @Expose()
  roles: Roles[];

  @Exclude()
  password: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
