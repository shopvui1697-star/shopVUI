import { Module } from '@nestjs/common';
import { AdminImportsService } from './admin-imports.service';
import { AdminImportsController } from './admin-imports.controller';

@Module({
  controllers: [AdminImportsController],
  providers: [AdminImportsService],
})
export class AdminImportsModule {}
