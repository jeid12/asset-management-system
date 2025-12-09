// src/config/env.config.ts
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiBasePath: process.env.API_BASE_PATH || '/api',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // OTP Configuration
  otp: {
    expiresIn: process.env.OTP_EXPIRES_IN || '10m',
  },

  // Email Configuration
  email: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_PORT === '465',
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'RTB Asset Management <noreply@rtb.gov.rw>',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // Frontend Configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
    resetPasswordPath: process.env.FRONTEND_RESET_PASSWORD_PATH || '/reset-password',
    verifyEmailPath: process.env.FRONTEND_VERIFY_EMAIL_PATH || '/verify-email',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/jpg'],
    allowedDocumentTypes: process.env.ALLOWED_DOCUMENT_TYPES?.split(',') || ['application/pdf'],
  },

  // Swagger Configuration
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    path: process.env.SWAGGER_PATH || '/api-docs',
    title: process.env.SWAGGER_TITLE || 'RTB Asset Management API',
    description: process.env.SWAGGER_DESCRIPTION || 'API for managing devices, schools, and applications',
    version: process.env.SWAGGER_VERSION || '1.0.0',
  },

  // Deployment Configuration
  deployment: {
    renderExternalUrl: process.env.RENDER_EXTERNAL_URL || '',
  },

  // Feature Flags
  features: {
    auditLogs: process.env.ENABLE_AUDIT_LOGS !== 'false',
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  },
};

// Validate required environment variables
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
}
