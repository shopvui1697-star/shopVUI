import {
  IsEnum,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export enum ResellerStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
}

export enum PayoutStatusEnum {
  APPROVED = 'APPROVED',
  PAID = 'PAID',
}

export class UpdateResellerStatusDto {
  @IsEnum(ResellerStatusEnum)
  status: 'ACTIVE' | 'INACTIVE' | 'REJECTED';
}

export class SetCommissionRateDto {
  @IsString()
  commissionType: string;

  @IsInt()
  @Min(0)
  commissionValue: number;
}

export class UpdatePayoutStatusDto {
  @IsEnum(PayoutStatusEnum)
  status: 'APPROVED' | 'PAID';
}
