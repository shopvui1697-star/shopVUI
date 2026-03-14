import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { ResellerGuard } from '../resellers/guards/reseller.guard';

@Controller('resellers/me/commissions')
@UseGuards(ResellerGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  async findByReseller(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.commissionsService.findByReseller(
      req.reseller.id,
      status,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }
}
