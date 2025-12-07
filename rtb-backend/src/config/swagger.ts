import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RTB Asset Management System API',
      version: '1.1.0',
      description: 'API documentation for the RTB Asset Management System',
      contact: {
        name: 'Support',
        email: 'support@rtb.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['admin', 'headteacher', 'staff'],
              description: 'User role',
            },
            department: {
              type: 'string',
              description: 'User department',
            },
            profilePictureUrl: {
              type: 'string',
              nullable: true,
              description: 'URL to user profile picture',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date',
            },
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            emailOrUsername: {
              type: 'string',
              example: 'user@example.com or username123',
              description: 'User email or username',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
              description: 'User password (minimum 6 characters)',
            },
          },
          required: ['emailOrUsername', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
            },
            message: {
              type: 'string',
            },
            token: {
              type: 'string',
              description: 'JWT token',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
          },
        },
        LogoutResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
            },
            success: {
              type: 'boolean',
            },
          },
        },
        VerifyOtpRequest: {
          type: 'object',
          properties: {
            emailOrUsername: {
              type: 'string',
              example: 'user@example.com or username123',
              description: 'User email or username',
            },
            otp: {
              type: 'string',
              example: '123456',
              description: 'One-time password received via email',
            },
          },
          required: ['emailOrUsername', 'otp'],
        },
        OtpSentResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'OTP sent to your email. Please verify to complete login.',
            },
            otpSent: {
              type: 'boolean',
              example: true,
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            fullName: {
              type: 'string',
              example: 'John Doe',
              description: 'User full name',
            },
            username: {
              type: 'string',
              example: 'johndoe123',
              description: 'Unique username',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'User email address',
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123',
              description: 'Password (minimum 6 characters)',
            },
            phoneNumber: {
              type: 'string',
              example: '1234567890',
              description: 'Phone number (10-15 digits)',
            },
            gender: {
              type: 'string',
              example: 'male',
              description: 'Gender (optional)',
            },
          },
          required: ['fullName', 'username', 'email', 'password', 'phoneNumber'],
        },
        ForgotPasswordRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
          required: ['email'],
        },
        ResetPasswordRequest: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'reset_token_from_email',
            },
            newPassword: {
              type: 'string',
              format: 'password',
              example: 'newpassword123',
            },
          },
          required: ['token', 'newPassword'],
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            department: {
              type: 'string',
              example: 'IT',
            },
          },
        },
        ChangePasswordRequest: {
          type: 'object',
          properties: {
            currentPassword: {
              type: 'string',
              format: 'password',
              example: 'currentpassword123',
            },
            newPassword: {
              type: 'string',
              format: 'password',
              example: 'newpassword123',
            },
          },
          required: ['currentPassword', 'newPassword'],
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
            },
            username: {
              type: 'string',
              example: 'johndoe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            phoneNumber: {
              type: 'string',
              example: '+1234567890',
            },
            role: {
              type: 'string',
              enum: ['school', 'admin', 'technician', 'rtb-staff'],
              example: 'school',
            },
            gender: {
              type: 'string',
              nullable: true,
              example: 'male',
            },
            profilePicture: {
              type: 'string',
              nullable: true,
              example: 'profile-123.jpg',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
            status: {
              type: 'integer',
              description: 'HTTP status code',
            },
          },
        },
        School: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            schoolCode: {
              type: 'string',
              example: 'TSS001',
            },
            schoolName: {
              type: 'string',
              example: 'Kigali Technical Secondary School',
            },
            category: {
              type: 'string',
              enum: ['TSS', 'VTC', 'Other'],
              example: 'TSS',
            },
            province: {
              type: 'string',
              example: 'Kigali City',
            },
            district: {
              type: 'string',
              example: 'Gasabo',
            },
            sector: {
              type: 'string',
              example: 'Remera',
            },
            cell: {
              type: 'string',
              nullable: true,
            },
            village: {
              type: 'string',
              nullable: true,
            },
            email: {
              type: 'string',
              format: 'email',
              nullable: true,
            },
            phoneNumber: {
              type: 'string',
              nullable: true,
            },
            address: {
              type: 'string',
              nullable: true,
            },
            representativeId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            representative: {
              type: 'object',
              nullable: true,
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                fullName: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
              },
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const specs = swaggerJsdoc(options);
