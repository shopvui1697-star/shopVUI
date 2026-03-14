import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { AdminGuard } from '../resellers/guards/admin.guard';

@Controller('admin/commissions')
@UseGuards(AdminGuard)
export class CommissionsAdminController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commissionsService.findAll(
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @Post('payout')
  async processPayouts(@Body() body: { commissionIds: string[] }) {
    return this.commissionsService.processPayouts(body.commissionIds);
  }
}
