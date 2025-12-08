// app/config/constants.ts

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "RTB Asset Management System";
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Asset Management System for Rwanda TVET Board";

// Pagination
export const DEFAULT_PAGE_SIZE = Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_SIZE) || 10;
export const MAX_PAGE_SIZE = Number(process.env.NEXT_PUBLIC_MAX_PAGE_SIZE) || 100;

// File uploads
export const MAX_FILE_SIZE = Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 5242880; // 5MB
export const ALLOWED_IMAGE_TYPES = process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/jpg'];
export const ALLOWED_DOCUMENT_TYPES = process.env.NEXT_PUBLIC_ALLOWED_DOCUMENT_TYPES?.split(',') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  RTB_STAFF: 'rtb-staff',
  HEAD_TEACHER: 'headteacher',
  SCHOOL_STAFF: 'school-staff',
} as const;

// Device categories
export const DEVICE_CATEGORIES = ['Laptop', 'Desktop', 'Tablet', 'Projector', 'Others'] as const;

// Device status
export const DEVICE_STATUS = ['Available', 'Assigned', 'Maintenance', 'Written Off'] as const;

// Device conditions
export const DEVICE_CONDITIONS = ['New', 'Good', 'Fair', 'Faulty'] as const;

// Application status
export const APPLICATION_STATUS = ['Pending', 'Approved', 'Rejected', 'Assigned'] as const;
