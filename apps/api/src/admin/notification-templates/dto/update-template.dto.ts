import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  PAYMENT = 'PAYMENT',
  COMMISSION = 'COMMISSION',
  SYSTEM = 'SYSTEM',
  ADMIN_ALERT = 'ADMIN_ALERT',
  RESELLER = 'RESELLER',
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  autoShow?: boolean;
}
