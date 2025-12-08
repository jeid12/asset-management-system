// src/dtos/device-application.dto.ts
import { IsString, IsInt, IsOptional, Min, IsEnum, IsUUID } from "class-validator";

export class CreateDeviceApplicationDto {
  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  justification?: string;

  @IsInt()
  @Min(0)
  requestedLaptops: number;

  @IsInt()
  @Min(0)
  requestedDesktops: number;

  @IsInt()
  @Min(0)
  requestedTablets: number;

  @IsInt()
  @Min(0)
  requestedProjectors: number;

  @IsInt()
  @Min(0)
  requestedOthers: number;
}

export class ReviewApplicationDto {
  @IsEnum(["Under Review", "Approved", "Rejected"])
  status: "Under Review" | "Approved" | "Rejected";

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsString()
  eligibilityNotes?: string;
}

export class UpdateEligibilityDto {
  @IsString()
  isEligible: string; // "true" or "false" as string from form

  @IsOptional()
  @IsString()
  eligibilityNotes?: string;
}

export class AssignDevicesDto {
  @IsString({ each: true })
  deviceIds: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmReceiptDto {
  @IsOptional()
  @IsString()
  confirmationNotes?: string;
}
