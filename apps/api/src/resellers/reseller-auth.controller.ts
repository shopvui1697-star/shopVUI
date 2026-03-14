import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ResellerAuthService } from './reseller-auth.service';
import { CreateResellerDto, LoginDto } from './dto/create-reseller.dto';

@Controller('resellers')
export class ResellerAuthController {
  constructor(private readonly resellerAuthService: ResellerAuthService) {}

  @Post('register')
  async register(@Body() dto: CreateResellerDto) {
    return this.resellerAuthService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.resellerAuthService.login(dto.email, dto.password);
  }
}
