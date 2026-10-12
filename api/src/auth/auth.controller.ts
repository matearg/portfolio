import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service.js';

class LoginDto {
  @IsString() email: string;
  @IsString() password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() { email, password }: LoginDto) {
    return this.auth.login(email, password);
  }
}
