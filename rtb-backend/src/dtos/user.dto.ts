import { IsEnum, IsInt, IsOptional, IsString, Min, IsEmail, Length, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(3, 100)
  fullName: string;

  @IsString()
  @Length(3, 50)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 100)
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsEnum(['school', 'admin', 'technician', 'rtb-staff'])
  role: 'school' | 'admin' | 'technician' | 'rtb-staff';

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';
}

export class BulkCreateUserDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
}

export class UpdateUserRoleDto {
  @IsEnum(['school', 'admin', 'technician', 'rtb-staff'])
  role: 'school' | 'admin' | 'technician' | 'rtb-staff';
}

export class GetUsersQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['school', 'admin', 'technician', 'rtb-staff'])
  role?: 'school' | 'admin' | 'technician' | 'rtb-staff';
}

export class UserResponseDto {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  gender?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedUsersResponseDto {
  success: boolean;
  data: UserResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
