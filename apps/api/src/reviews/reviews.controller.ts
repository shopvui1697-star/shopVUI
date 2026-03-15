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
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewListQueryDto } from './dto/review-list-query.dto';

@Controller('reviews')
@ApiTags('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a product review' })
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List approved reviews (public, optional auth for userHasVoted)' })
  async findAll(@Req() req: any, @Query() query: ReviewListQueryDto) {
    const userId = req.user?.id;
    return this.reviewsService.findAll(query, userId);
  }

  @Get('summary/:productId')
  @ApiOperation({ summary: 'Get review summary for a product' })
  async getSummary(@Param('productId') productId: string) {
    return this.reviewsService.getSummary(productId);
  }

  @Get('can-review/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user can review a product' })
  async canReview(@Req() req: any, @Param('productId') productId: string) {
    return this.reviewsService.canReview(req.user.id, productId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review' })
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.remove(id, req.user.id);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle helpful vote on a review' })
  async toggleVote(@Req() req: any, @Param('id') id: string) {
    return this.reviewsService.toggleVote(id, req.user.id);
  }
}
