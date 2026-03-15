import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { NotificationService } from '../../notification/notification.service';
import { GetNotificationsDto } from '../../notification/dto/get-notifications.dto';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('admin/notifications')
@ApiTags('admin-notifications')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminNotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send notification to users' })
  async send(@Body() dto: SendNotificationDto) {
    if (dto.templateId) {
      return this.notificationService.createFromTemplate(
        dto.templateId,
        dto.targetUserIds,
        {
          title: dto.title,
          body: dto.body,
          variables: dto.variables,
        },
      );
    }

    if (!dto.type || !dto.title || !dto.body) {
      throw new BadRequestException(
        'type, title, and body are required when not using a template',
      );
    }

    return this.notificationService.create({
      targetUserIds: dto.targetUserIds,
      type: dto.type,
      title: dto.title,
      body: dto.body,
    });
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Reply to a customer inquiry notification' })
  async reply(
    @Req() req: any,
    @Param('id') id: string,
    @Body('message') message: string,
  ) {
    if (!message?.trim()) {
      throw new BadRequestException('message is required');
    }
    return this.notificationService.replyToInquiry(id, req.user.id, message);
  }

  @Get()
  @ApiOperation({ summary: 'List admin notifications (paginated)' })
  async findAll(@Req() req: any, @Query() query: GetNotificationsDto) {
    return this.notificationService.findByUser(
      req.user.id,
      query.page,
      query.pageSize,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get admin unread notification count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all admin notifications as read' })
  async markAllAsRead(@Req() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { success: true };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark an admin notification as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, req.user.id);
    return { success: true };
  }
}
