import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AccountRole } from '../accounts/account-role.enum';

export interface AuthenticatedAccount {
  id: string;
  email: string;
  role: AccountRole;
}

@Injectable()
export class AuthService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getAccount(authId: string): Promise<AuthenticatedAccount> {
    const accounts = await this.dataSource.query<AuthenticatedAccount[]>(
      `SELECT id, email, role
       FROM shared_accounts
       WHERE auth_id = $1
       LIMIT 1`,
      [authId],
    );

    if (accounts.length === 0) {
      throw new NotFoundException(
        'No account was found for the authenticated user.',
      );
    }

    return accounts[0];
  }
}
