import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/roles/enum';
import { ROLES_KEY } from "src/roles/constant";

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
