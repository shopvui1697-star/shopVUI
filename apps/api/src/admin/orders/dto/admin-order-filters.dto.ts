import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatusEnum {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export enum PaymentStatusEnum {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export class AdminOrderFiltersDto {
  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusEnum)
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export enum BulkOrderAction {
  MARK_SHIPPED = 'mark_shipped',
  EXPORT_CSV = 'export_csv',
}

export class BulkOrderActionDto {
  @IsArray()
  @IsString({ each: true })
  orderIds: string[];

  @IsEnum(BulkOrderAction)
  action: 'mark_shipped' | 'export_csv';
}
