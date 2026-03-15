import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewListQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @IsOptional()
  @IsIn(['rating', 'createdAt', 'helpfulCount'])
  sortBy?: 'rating' | 'createdAt' | 'helpfulCount' = 'createdAt';
}
