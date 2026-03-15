import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { NotificationTemplatesService } from './notification-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('admin/notification-templates')
@ApiTags('admin-notification-templates')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class NotificationTemplatesController {
  constructor(private readonly templatesService: NotificationTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all notification templates' })
  async findAll() {
    return this.templatesService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a notification template' })
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification template' })
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification template' })
  async delete(@Param('id') id: string) {
    await this.templatesService.delete(id);
    return { success: true };
  }
}
