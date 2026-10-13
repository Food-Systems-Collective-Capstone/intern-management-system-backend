import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { AuthenticatedAccount } from './auth.service';

type AuthenticatedRequest = Request & {
  user: {
    sub: string;
  };
};

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getCurrentAccount(
    @Req() request: AuthenticatedRequest,
  ): Promise<AuthenticatedAccount> {
    return this.authService.getAccount(request.user.sub);
  }
}
