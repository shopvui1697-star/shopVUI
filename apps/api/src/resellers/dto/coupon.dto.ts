import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class ProposeResellerCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class ApproveResellerCouponDto {
  @IsNotEmpty()
  @IsString()
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

  @IsNotEmpty()
  @IsString()
  commissionType: string;

  @IsInt()
  @Min(0)
  commissionValue: number;

  @IsOptional()
  @IsString()
  commissionBase?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maturityDays?: number;
}
