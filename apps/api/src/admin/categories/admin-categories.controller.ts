import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminCategoriesService } from './admin-categories.service';

@Controller('admin/categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  async findAll() {
    return this.adminCategoriesService.findAll();
  }
}
