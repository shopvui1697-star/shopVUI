import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../guards/admin.guard';
import { AdminImportsService } from './admin-imports.service';

@Controller('admin/imports')
@UseGuards(AdminGuard)
export class AdminImportsController {
  constructor(private readonly adminImportsService: AdminImportsService) {}

  @Post('orders')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async importOrders(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.adminImportsService.importOrdersCsv(file.buffer);
  }
}
