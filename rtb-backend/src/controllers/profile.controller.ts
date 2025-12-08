// src/controllers/profile.controller.ts
import { Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { UpdateProfileDto } from "../dtos/profile.dto";
import { ChangePasswordDto } from "../dtos/auth.dto";
import { validateDto } from "../utils/validator.util";
import { hashPassword, comparePassword } from "../utils/password.util";
import { AuthRequest } from "../middlewares/auth.middleware";
import fs from "fs";
import path from "path";

const userRepository = AppDataSource.getRepository(User);

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        gender: user.gender,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Validate request body
    const { isValid, errors } = await validateDto(UpdateProfileDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { fullName, username, email, phoneNumber, gender } = req.body;

    // Check if email or username is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await userRepository.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({ message: "Email already in use" });
        return;
      }
    }

    if (username && username !== user.username) {
      const existingUser = await userRepository.findOne({ where: { username } });
      if (existingUser) {
        res.status(409).json({ message: "Username already in use" });
        return;
      }
    }

    // Update user fields
    if (fullName) user.fullName = fullName;
    if (username) user.username = username;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;

    await userRepository.save(user);

    res.status(200).json({
      message: "Profile updated successfully",
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
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Validate request body
    const { isValid, errors } = await validateDto(ChangePasswordDto, req.body);
    if (!isValid) {
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedPassword;
    await userRepository.save(user);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldImagePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Save new profile picture path
    const profilePicturePath = `uploads/profiles/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await userRepository.save(user);

    res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePicturePath,
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProfilePicture = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.profilePicture) {
      res.status(400).json({ message: "No profile picture to delete" });
      return;
    }

    // Delete profile picture file
    const imagePath = path.join(process.cwd(), user.profilePicture);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Remove profile picture from database
    user.profilePicture = undefined;
    await userRepository.save(user);

    res.status(200).json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Delete profile picture file if exists
    if (user.profilePicture) {
      const imagePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete user from database
    await userRepository.remove(user);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
