import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminGuard } from '../guards/admin.guard';
import { AdminChannelsService } from './admin-channels.service';

@Controller('admin/channels')
@UseGuards(AdminGuard)
export class AdminChannelsController {
  constructor(private readonly adminChannelsService: AdminChannelsService) {}

  @Get()
  async findAll() {
    return this.adminChannelsService.findAll();
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerSync(@Param('id') id: string) {
    return this.adminChannelsService.triggerSync(id);
  }

  @Patch(':id')
  async updateSettings(
    @Param('id') id: string,
    @Body() body: { syncEnabled?: boolean; syncIntervalMinutes?: number },
  ) {
    return this.adminChannelsService.updateSettings(id, body);
  }

  @Delete(':id')
  async deleteConnection(@Param('id') id: string) {
    await this.adminChannelsService.deleteConnection(id);
    return { success: true };
  }

  @Get(':id/logs')
  async getLogs(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminChannelsService.getLogs(
      id,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
