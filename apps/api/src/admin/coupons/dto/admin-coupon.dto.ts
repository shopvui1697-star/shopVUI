import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';

export enum CouponTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsEnum(CouponTypeEnum)
  type: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  applicableCategory?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  buyQty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  getQty?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(CouponTypeEnum)
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchase?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  applicableCategory?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  buyQty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  getQty?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ApproveCouponDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}
