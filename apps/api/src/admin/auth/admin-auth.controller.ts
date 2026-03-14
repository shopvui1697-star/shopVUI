import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@shopvui/db';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../auth/auth.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access required');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.authService.generateTokens({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    });

    return { token: tokens.accessToken, accessToken: tokens.accessToken };
  }
}
