// src/dtos/auth.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Matches } from "class-validator";

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{10,15}$/, { message: "Phone number must be 10-15 digits" })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  gender?: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  emailOrUsername: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  newPassword: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  emailOrUsername: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{4,8}$/, { message: "OTP must be numeric (4-8 digits)" })
  otp: string;
}

export class VerifyResetOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: "OTP must be 6 digits" })
  otp: string;
}

export class ResetPasswordWithOtpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: "OTP must be 6 digits" })
  otp: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, { 
    message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
  })
  newPassword: string;
}
