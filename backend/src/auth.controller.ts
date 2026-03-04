import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginRequest {
  email: string;
  password: string;
}

interface RecoverPasswordRequest {
  email: string;
}

interface RegisterUserRequest {
  email: string;
  password: string;
  name?: string;
  date?: string;
  phone?: string;
  enrollment?: string;
  description?: string;
  permissions?: string[];
  groups?: string[];
  createdAt?: string;
}

interface LogoutRequest {
  token?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() body: LoginRequest,
  ): Promise<{ uid: string; email: string; idToken: string; refreshToken: string }> {
    return this.authService.login(body.email, body.password);
  }

  @Post('recover-password')
  async recoverPassword(@Body() body: RecoverPasswordRequest) {
    await this.authService.recoverPassword(body.email);
    return { success: true };
  }

  @Post('register-user')
  registerUser(@Body() body: RegisterUserRequest) {
    return this.authService.registerUser(body);
  }

  @Get('user/:uid')
  getUser(@Param('uid') uid: string) {
    return this.authService.getUserProfile(uid);
  }

  @Post('logout')
  async logout(@Body() body: LogoutRequest) {
    await this.authService.logout(body.token);
    return { success: true };
  }
}
