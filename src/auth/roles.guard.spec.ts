import {
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AccountRole } from '../accounts/account-role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };
  const dataSource = {
    query: jest.fn(),
  };

  function context(user?: { sub: string }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      dataSource as unknown as DataSource,
    );
  });

  it('rejects role-protected routes without a JWT subject', async () => {
    reflector.getAllAndOverride.mockReturnValue([AccountRole.Admin]);

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows administrators to override another role requirement', async () => {
    reflector.getAllAndOverride.mockReturnValue([AccountRole.Mentor]);
    dataSource.query.mockResolvedValue([{ role: AccountRole.Admin }]);

    await expect(guard.canActivate(context({ sub: 'admin-id' }))).resolves.toBe(
      true,
    );
  });

  it('blocks non-admin roles from administrator access', async () => {
    reflector.getAllAndOverride.mockReturnValue([AccountRole.Admin]);
    dataSource.query.mockResolvedValue([{ role: AccountRole.Mentor }]);

    await expect(
      guard.canActivate(context({ sub: 'mentor-id' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
