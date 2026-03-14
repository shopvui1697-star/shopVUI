import { Module } from '@nestjs/common';
import { PriceTiersService } from './price-tiers.service';
import { PriceTiersController } from './price-tiers.controller';

@Module({
  providers: [PriceTiersService],
  controllers: [PriceTiersController],
  exports: [PriceTiersService],
})
export class PriceTiersModule {}
