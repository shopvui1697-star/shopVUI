import { Module } from '@nestjs/common';
import { AdminResellersService } from './admin-resellers.service';
import { AdminResellersController } from './admin-resellers.controller';

@Module({
  controllers: [AdminResellersController],
  providers: [AdminResellersService],
  exports: [AdminResellersService],
})
export class AdminResellersModule {}
