import { IsString, IsEnum, IsOptional, IsNotEmpty, ValidateNested, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class CreateDeviceDto {
  @IsNotEmpty()
  @IsString()
  serialNumber: string;

  @IsNotEmpty()
  @IsEnum(["Laptop", "Desktop", "Tablet", "Projector", "Others"])
  category: "Laptop" | "Desktop" | "Tablet" | "Projector" | "Others";

  @IsNotEmpty()
  @IsString()
  brand: string;

  @IsNotEmpty()
  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsNotEmpty()
  @IsEnum(["Available", "Assigned", "Maintenance", "Written Off"])
  status: "Available" | "Assigned" | "Maintenance" | "Written Off";

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsNotEmpty()
  @IsEnum(["New", "Good", "Fair", "Faulty"])
  condition: "New" | "Good" | "Fair" | "Faulty";

  @IsOptional()
  @IsString()
  assetTag?: string;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsEnum(["Laptop", "Desktop", "Tablet", "Projector", "Others"])
  category?: "Laptop" | "Desktop" | "Tablet" | "Projector" | "Others";

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  schoolCode?: string;

  @IsOptional()
  @IsEnum(["Available", "Assigned", "Maintenance", "Written Off"])
  status?: "Available" | "Assigned" | "Maintenance" | "Written Off";

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsEnum(["New", "Good", "Fair", "Faulty"])
  condition?: "New" | "Good" | "Fair" | "Faulty";

  @IsOptional()
  @IsString()
  assetTag?: string;
}

export class BulkCreateDeviceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeviceDto)
  devices: CreateDeviceDto[];
}

export class BulkAssignDeviceDto {
  @IsArray()
  @IsString({ each: true })
  serialNumbers: string[];

  @IsNotEmpty()
  @IsString()
  schoolCode: string;
}
