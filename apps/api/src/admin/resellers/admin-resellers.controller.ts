import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminResellersService } from './admin-resellers.service';
import type {
  UpdateResellerStatusDto,
  SetCommissionRateDto,
  UpdatePayoutStatusDto,
} from './dto/admin-reseller.dto';

@Controller('admin/resellers')
@UseGuards(AdminGuard)
export class AdminResellersController {
  constructor(private readonly adminResellersService: AdminResellersService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.adminResellersService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateResellerStatusDto) {
    return this.adminResellersService.updateStatus(id, body.status);
  }

  @Patch(':id/commission')
  async setCommissionRate(@Param('id') id: string, @Body() body: SetCommissionRateDto) {
    return this.adminResellersService.setCommissionRate(id, body.commissionType, body.commissionValue);
  }

  @Get('payouts')
  async findPayouts(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminResellersService.findPayouts({
      status,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Patch('payouts/:id/status')
  async updatePayoutStatus(@Param('id') id: string, @Body() body: UpdatePayoutStatusDto) {
    return this.adminResellersService.updatePayoutStatus(id, body.status);
  }

  @Get('payouts/export')
  async exportPayoutsCsv(@Query('status') status?: string) {
    return this.adminResellersService.exportPayoutsCsv({ status });
  }
}
