import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResellersService } from './resellers.service';
import { ResellerAuthService } from './reseller-auth.service';
import { ResellerAuthController } from './reseller-auth.controller';
import { ResellersController } from './resellers.controller';
import { ResellersAdminController } from './resellers-admin.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [ResellerAuthController, ResellersController, ResellersAdminController],
  providers: [ResellersService, ResellerAuthService],
  exports: [ResellersService],
})
export class ResellersModule {}
