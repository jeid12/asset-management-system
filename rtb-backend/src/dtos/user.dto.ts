import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
