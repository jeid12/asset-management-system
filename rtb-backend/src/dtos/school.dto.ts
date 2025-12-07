import { IsString, IsEnum, IsOptional, IsEmail, IsUUID, Length, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSchoolDto {
  @IsString()
  @Length(1, 50)
  schoolCode: string;

  @IsString()
  @Length(1, 200)
  schoolName: string;

  @IsEnum(['TSS', 'VTC', 'Other'])
  category: 'TSS' | 'VTC' | 'Other';

  @IsString()
  @Length(1, 50)
  province: string;

  @IsString()
  @Length(1, 50)
  district: string;

  @IsString()
  @Length(1, 50)
  sector: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  cell?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  village?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  representativeId?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  schoolName?: string;

  @IsOptional()
  @IsEnum(['TSS', 'VTC', 'Other'])
  category?: 'TSS' | 'VTC' | 'Other';

  @IsOptional()
  @IsString()
  @Length(1, 50)
  province?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  district?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  sector?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  cell?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  village?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUUID()
  representativeId?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}

export class BulkCreateSchoolDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolDto)
  schools: CreateSchoolDto[];
}

export class GetSchoolsQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['TSS', 'VTC', 'Other'])
  category?: 'TSS' | 'VTC' | 'Other';

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}
