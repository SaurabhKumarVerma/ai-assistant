import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  async login(@Body() body: { token: string }) {
    return this.authService.loginWithClerk(body.token);
  }

  @Post('token/refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.tokenService.refreshToken(body.refreshToken);
  }
}