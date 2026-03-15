import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { NotifyAdminDto } from './dto/notify-admin.dto';

@Controller('notifications')
@ApiTags('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('notify-admin')
  @ApiOperation({ summary: 'Send a notification to admin about a product' })
  async notifyAdmin(@Req() req: any, @Body() dto: NotifyAdminDto) {
    await this.notificationService.notifyAdmins({
      senderId: req.user.id,
      senderName: req.user.name ?? req.user.email,
      productId: dto.productId,
      productName: dto.productName,
      message: dto.message,
    });
    return { success: true };
  }

  @Get('product/:productId/history')
  @ApiOperation({ summary: 'Get notification history for a product' })
  async getProductHistory(@Req() req: any, @Param('productId') productId: string) {
    return this.notificationService.getProductHistory(req.user.id, productId);
  }

  @Get()
  @ApiOperation({ summary: 'List user notifications (paginated)' })
  async findAll(@Req() req: any, @Query() query: GetNotificationsDto) {
    return this.notificationService.findByUser(
      req.user.id,
      query.page,
      query.pageSize,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { success: true };
  }
}
