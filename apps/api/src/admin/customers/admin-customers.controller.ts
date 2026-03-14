import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminCustomersService } from './admin-customers.service';

@Controller('admin/customers')
@UseGuards(AdminGuard)
export class AdminCustomersController {
  constructor(private readonly adminCustomersService: AdminCustomersService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('minSpend') minSpend?: string,
    @Query('maxSpend') maxSpend?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminCustomersService.findAll({
      search,
      minSpend: minSpend ? parseInt(minSpend, 10) : undefined,
      maxSpend: maxSpend ? parseInt(maxSpend, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adminCustomersService.findOne(id);
  }
}
