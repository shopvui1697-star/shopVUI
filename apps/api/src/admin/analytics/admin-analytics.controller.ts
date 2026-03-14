import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';

@Controller('admin/analytics')
@UseGuards(AdminGuard)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get('overview')
  async overview(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminAnalyticsService.overview(dateFrom, dateTo);
  }

  @Get('revenue-by-channel')
  async revenueByChannel(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminAnalyticsService.revenueByChannel(dateFrom, dateTo);
  }

  @Get('revenue-over-time')
  async revenueOverTime(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.adminAnalyticsService.revenueOverTime(
      dateFrom,
      dateTo,
      granularity,
    );
  }

  @Get('top-products')
  async topProducts(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminAnalyticsService.topProducts(
      dateFrom,
      dateTo,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('order-volume')
  async orderVolume(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminAnalyticsService.orderVolume(dateFrom, dateTo);
  }

  @Get('aov-by-channel')
  async aovByChannel(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('granularity') granularity?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.adminAnalyticsService.aovByChannel(
      dateFrom,
      dateTo,
      granularity,
    );
  }

  @Get('reseller-performance')
  async resellerPerformance(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminAnalyticsService.resellerPerformance(dateFrom, dateTo);
  }
}
