// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { Otp } from "../entities/Otp";
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyOtpDto, VerifyResetOtpDto, ResetPasswordWithOtpDto } from "../dtos/auth.dto";
import { validateDto } from "../utils/validator.util";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateToken, verifyToken } from "../utils/jwt.util";
import { sendWelcomeEmail, sendOtpEmail } from "../utils/email.util";
import { tokenBlacklist } from "../utils/tokenBlacklist.util";
import { AuthRequest } from "../middlewares/auth.middleware";
import { createOtpForUser, verifyOtpForUser } from "../utils/otp.util";
import { createSession, endSession } from "../utils/session.util";
import { getClientIp } from "../middlewares/audit.middleware";

const userRepository = AppDataSource.getRepository(User);
const otpRepository = AppDataSource.getRepository(Otp);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { isValid, errors } = await validateDto(RegisterDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { fullName, username, email, password, phoneNumber, gender } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(409).json({ message: "User with this email or username already exists" });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = userRepository.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      gender,
      role: "school", // Default role
    });

    await userRepository.save(user);

    // Send welcome email (optional, don't fail if it doesn't work)
    try {
      await sendWelcomeEmail(email, fullName);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        gender: user.gender,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { isValid, errors } = await validateDto(LoginDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate and send OTP
    try {
      const otp = await createOtpForUser(user.id, 5); // 5 minutes expiry
      await sendOtpEmail(user.email, otp.code);
      
      res.status(200).json({
        message: "OTP sent to your email. Please verify to complete login.",
        otpSent: true,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body (using LoginDto since it has the same fields)
    const { isValid, errors } = await validateDto(LoginDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    const user = await userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate and send new OTP
    try {
      const otp = await createOtpForUser(user.id, 5); // 5 minutes expiry
      await sendOtpEmail(user.email, otp.code);
      
      res.status(200).json({
        message: "New OTP sent to your email. Please verify to complete login.",
        otpSent: true,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      res.status(500).json({ message: "Failed to send OTP. Please try again." });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { isValid, errors } = await validateDto(ForgotPasswordDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { email } = req.body;

    // Find user
    const user = await userRepository.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json({ message: "If the email exists, a password reset code has been sent" });
      return;
    }

    // Generate OTP for password reset
    const otp = await createOtpForUser(user.id, 10); // 10 minutes expiry

    // Send OTP email
    try {
      await sendOtpEmail(email, otp.code);
      res.status(200).json({ 
        message: "If the email exists, a password reset code has been sent",
        success: true 
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      res.status(500).json({ message: "Failed to send reset code. Please try again." });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { isValid, errors } = await validateDto(VerifyResetOtpDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { email, otp } = req.body;

    // Find user
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "Invalid request" });
      return;
    }

    // Verify OTP (but don't mark as used yet - save for actual reset)
    const otpRecord = await otpRepository.findOne({
      where: { userId: user.id, code: otp, used: false },
      order: { createdAt: "DESC" },
    });

    if (!otpRecord) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    if (otpRecord.expiresAt < new Date()) {
      res.status(400).json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    res.status(200).json({ 
      message: "OTP verified successfully",
      success: true 
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if request is OTP-based or token-based
    if (req.body.otp) {
      // OTP-based reset
      const { isValid, errors } = await validateDto(ResetPasswordWithOtpDto, req.body);
      if (!isValid) {
        res.status(400).json({ message: "Validation failed", errors });
        return;
      }

      const { email, otp, newPassword } = req.body;

      // Find user
      const user = await userRepository.findOne({ where: { email } });
      if (!user) {
        res.status(400).json({ message: "Invalid request" });
        return;
      }

      // Verify and use OTP
      const isValidOtp = await verifyOtpForUser(user.id, otp);
      if (!isValidOtp) {
        res.status(400).json({ message: "Invalid or expired OTP" });
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await userRepository.save(user);

      res.status(200).json({ 
        message: "Password reset successfully",
        success: true 
      });
    } else {
      // Token-based reset (original flow)
      const { isValid, errors } = await validateDto(ResetPasswordDto, req.body);
      if (!isValid) {
        res.status(400).json({ message: "Validation failed", errors });
        return;
      }

      const { token, newPassword } = req.body;

      // Verify token
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
        return;
      }

      // Find user
      const user = await userRepository.findOne({ where: { id: decoded.id } });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      await userRepository.save(user);

      res.status(200).json({ message: "Password reset successfully" });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { isValid, errors } = await validateDto(VerifyOtpDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { emailOrUsername, otp } = req.body;

    // Find user by email or username
    const user = await userRepository.findOne({
      where: [{ email: emailOrUsername }, { username: emailOrUsername }],
    });

    if (!user) {
      res.status(401).json({ message: "Invalid request" });
      return;
    }

    // Verify OTP
    const isOtpValid = await verifyOtpForUser(user.id, otp);
    
    if (!isOtpValid) {
      res.status(401).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Generate token after successful OTP verification
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Create session for tracking time spent
    const ipAddress = getClientIp(req);
    const sessionId = createSession(user.id, ipAddress);

    res.status(200).json({
      message: "Login successful",
      token,
      sessionId,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        gender: user.gender,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const token = req.token;
    
    if (!token) {
      res.status(400).json({ message: "No token provided" });
      return;
    }

    // End session if sessionId is provided
    const sessionId = req.body.sessionId || req.headers['x-session-id'];
    if (sessionId) {
      await endSession(sessionId as string);
    }

    // Get the decoded token to access expiration time
    const decoded = verifyToken(token);
    
    // Add token to blacklist with its expiration time
    // The expiration time is typically set in the JWT (exp claim)
    const jwtPayload = decoded as any;
    const expiresAt = jwtPayload.exp || Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // Default to 7 days
    
    tokenBlacklist.addToBlacklist(token, expiresAt);

    res.status(200).json({ 
      message: "Logout successful",
      success: true 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
