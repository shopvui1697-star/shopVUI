import { IsOptional, IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ minLength: 10, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment?: string;
}
