import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@shopvui/db';
import type { AuthTokens, AuthUser, GoogleProfile } from '@shopvui/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async findOrCreateUser(profile: GoogleProfile): Promise<AuthUser> {
    const existing = await prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (existing) {
      const updated = await prisma.user.update({
        where: { googleId: profile.googleId },
        data: {
          name: profile.name,
          avatar: profile.avatar,
          email: profile.email,
        },
      });
      return this.toAuthUser(updated);
    }

    const user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        googleId: profile.googleId,
        avatar: profile.avatar,
      },
    });
    return this.toAuthUser(user);
  }

  async generateTokens(user: AuthUser & { role?: string }): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, role: user.role ?? 'CUSTOMER' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(this.toAuthUser(user));
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toAuthUser(user) : null;
  }

  private toAuthUser(user: { id: string; email: string; name: string | null; avatar: string | null }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }
}
