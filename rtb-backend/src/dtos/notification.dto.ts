// src/dtos/notification.dto.ts
import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID } from "class-validator";

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum([
    "application_submitted",
    "application_reviewed",
    "application_approved",
    "application_rejected",
    "devices_assigned",
    "devices_received",
    "device_assigned",
    "device_maintenance",
    "school_created",
    "user_created",
    "system_alert",
  ])
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class MarkAsReadDto {
  @IsBoolean()
  isRead: boolean;
}
