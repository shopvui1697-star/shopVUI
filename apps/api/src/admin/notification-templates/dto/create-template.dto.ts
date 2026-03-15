import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  PAYMENT = 'PAYMENT',
  COMMISSION = 'COMMISSION',
  SYSTEM = 'SYSTEM',
  ADMIN_ALERT = 'ADMIN_ALERT',
  RESELLER = 'RESELLER',
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsBoolean()
  autoShow?: boolean;
}
