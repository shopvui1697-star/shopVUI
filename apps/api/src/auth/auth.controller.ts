import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from '@shopvui/shared';

@Controller('auth')
@ApiTags('auth')
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth2 login' })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth2 callback' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as AuthUser;
    const tokens = await this.authService.generateTokens(user);

    const allowedOrigins = [
      process.env.WEB_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001',
    ];
    const requestedOrigin = req.query.state as string;
    const redirectUrl = allowedOrigins.includes(requestedOrigin)
      ? requestedOrigin
      : allowedOrigins[0];

    res.redirect(
      `${redirectUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getMe(@Req() req: Request) {
    const user = req.user as { sub: string; email: string };
    const authUser = await this.authService.getUserById(user.sub);
    if (!authUser) {
      throw new UnauthorizedException('User not found');
    }
    return authUser;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }
    try {
      return await this.authService.refreshTokens(body.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
