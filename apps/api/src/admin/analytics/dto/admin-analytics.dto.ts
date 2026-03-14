import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum GranularityEnum {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class AnalyticsFilters {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(GranularityEnum)
  granularity?: 'daily' | 'weekly' | 'monthly';
}
