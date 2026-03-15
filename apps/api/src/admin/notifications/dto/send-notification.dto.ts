import {
  IsArray,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum NotificationType {
  ORDER_STATUS = 'ORDER_STATUS',
  PAYMENT = 'PAYMENT',
  COMMISSION = 'COMMISSION',
  SYSTEM = 'SYSTEM',
  ADMIN_ALERT = 'ADMIN_ALERT',
  RESELLER = 'RESELLER',
  CONVERSATION = 'CONVERSATION',
}

export class SendNotificationDto {
  @ApiProperty({ description: 'Target user IDs to send notification to' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  targetUserIds: string[];

  @ApiPropertyOptional({ description: 'Template ID to use for the notification' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Notification type (required if no templateId)' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Title override (or required if no templateId)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Body override (or required if no templateId)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ description: 'Template variable values for interpolation' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
