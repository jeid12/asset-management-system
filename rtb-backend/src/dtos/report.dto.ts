// src/dtos/report.dto.ts
import { IsOptional, IsString, IsEnum, IsDateString, IsArray } from "class-validator";

export enum ReportType {
  DEVICES = "devices",
  APPLICATIONS = "applications",
  USERS = "users",
  SCHOOLS = "schools",
  AUDIT_LOGS = "audit_logs",
  NOTIFICATIONS = "notifications",
}

export enum ExportFormat {
  CSV = "csv",
  PDF = "pdf",
}

export enum DeviceStatus {
  AVAILABLE = "Available",
  IN_USE = "In Use",
  UNDER_MAINTENANCE = "Under Maintenance",
  RETIRED = "Retired",
}

export enum ApplicationStatus {
  PENDING = "Pending",
  UNDER_REVIEW = "Under Review",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  ASSIGNED = "Assigned",
  RECEIVED = "Received",
  CANCELLED = "Cancelled",
}

export class ReportFilterDto {
  @IsEnum(ReportType)
  reportType!: ReportType;

  @IsOptional()
  @IsEnum(ExportFormat)
  exportFormat?: ExportFormat;

  // Date range filters
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Device-specific filters
  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsEnum(DeviceStatus)
  deviceStatus?: DeviceStatus;

  @IsOptional()
  @IsString()
  assignedToSchoolId?: string;

  // Application-specific filters
  @IsOptional()
  @IsEnum(ApplicationStatus)
  applicationStatus?: ApplicationStatus;

  @IsOptional()
  @IsString()
  schoolId?: string;

  // User-specific filters
  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsString()
  userStatus?: string;

  // Audit log filters
  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  targetEntity?: string;

  // Column selection for export
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedColumns?: string[];

  // Sorting
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";

  // Pagination (for preview)
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
