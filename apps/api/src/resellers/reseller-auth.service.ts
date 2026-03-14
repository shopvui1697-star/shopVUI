import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@shopvui/db';
import * as bcrypt from 'bcryptjs';
import { CreateResellerDto } from './dto/create-reseller.dto';

@Injectable()
export class ResellerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: CreateResellerDto) {
    if (!dto.password || dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const existingUser = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          role: 'RESELLER',
        },
      });

      const reseller = await tx.reseller.create({
        data: {
          userId: user.id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          socialProfiles: dto.socialProfiles ?? undefined,
          reason: dto.reason,
        },
      });

      return { user, reseller };
    });

    return {
      message: 'Application submitted. You will be notified when approved.',
      resellerId: result.reseller.id,
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const reseller = await prisma.reseller.findUnique({ where: { userId: user.id } });
    if (!reseller || reseller.status !== 'ACTIVE') {
      throw new UnauthorizedException('Reseller account is not active');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '24h',
    });

    return { accessToken };
  }

  async validateCredentials(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    return valid ? user : null;
  }
}
