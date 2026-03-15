import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminReviewListQueryDto } from './dto/admin-review-list-query.dto';

@Controller('admin/reviews')
@ApiTags('admin-reviews')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reviews with filters (admin)' })
  async findAll(@Query() query: AdminReviewListQueryDto) {
    return this.adminReviewsService.findAll(query);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a review' })
  async approve(@Param('id') id: string) {
    return this.adminReviewsService.approve(id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a review' })
  async reject(@Param('id') id: string) {
    return this.adminReviewsService.reject(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review and its votes' })
  async remove(@Param('id') id: string) {
    return this.adminReviewsService.remove(id);
  }
}
