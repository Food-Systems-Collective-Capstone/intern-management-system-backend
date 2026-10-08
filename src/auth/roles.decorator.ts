import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '../accounts/account-role.enum';

export const Roles = (...roles: AccountRole[]) => SetMetadata('roles', roles);
