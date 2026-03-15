import { IsString, IsInt, Min, Max, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ minLength: 10, maxLength: 1000 })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  comment: string;
}
