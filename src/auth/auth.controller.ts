import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { token: string }) {
    try {
      return await this.authService.loginWithClerk(body.token);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('webhook')
  async handleClerkWebhook(@Body() body: any) {
    return this.authService.handleClerkWebhook(body);
  }
}