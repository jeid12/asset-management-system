import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entities/User';
import { UpdateUserRoleDto, GetUsersQueryDto } from '../dtos/user.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Like } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

const userRepository = AppDataSource.getRepository(User);

/**
 * Get all users with pagination and filtering (Admin only)
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const queryDto = plainToClass(GetUsersQueryDto, {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      search: req.query.search,
      role: req.query.role
    });

    const errors = await validate(queryDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map(err => ({
          field: err.property,
          errors: Object.values(err.constraints || {})
        }))
      });
    }

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 10;
    const skip = (page - 1) * limit;

    // Build query conditions
    const where: any = {};
    
    if (queryDto.role) {
      where.role = queryDto.role;
    }

    if (queryDto.search) {
      const searchTerm = `%${queryDto.search}%`;
      const [users, total] = await userRepository.findAndCount({
        where: [
          { ...where, fullName: Like(searchTerm) },
          { ...where, username: Like(searchTerm) },
          { ...where, email: Like(searchTerm) }
        ],
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
        select: ['id', 'fullName', 'username', 'email', 'phoneNumber', 'role', 'gender', 'profilePicture', 'createdAt', 'updatedAt']
      });

      return res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    const [users, total] = await userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: ['id', 'fullName', 'username', 'email', 'phoneNumber', 'role', 'gender', 'profilePicture', 'createdAt', 'updatedAt']
    });

    return res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fullName', 'username', 'email', 'phoneNumber', 'role', 'gender', 'profilePicture', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authReq = req as AuthRequest;
    const adminId = authReq.user?.id;

    // Prevent admin from changing their own role
    if (userId === adminId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    const updateDto = plainToClass(UpdateUserRoleDto, req.body);
    const errors = await validate(updateDto);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map(err => ({
          field: err.property,
          errors: Object.values(err.constraints || {})
        }))
      });
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = updateDto.role;
    await userRepository.save(user);

    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authReq = req as AuthRequest;
    const adminId = authReq.user?.id;

    // Prevent admin from deleting themselves
    if (userId === adminId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account. Use the profile deletion endpoint instead.'
      });
    }

    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      const picturePath = path.join(process.cwd(), 'uploads', 'profiles', user.profilePicture);
      if (fs.existsSync(picturePath)) {
        fs.unlinkSync(picturePath);
      }
    }

    await userRepository.remove(user);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

/**
 * Get user statistics (Admin only)
 */
export const getUserStats = async (_req: Request, res: Response) => {
  try {
    const totalUsers = await userRepository.count();
    const adminCount = await userRepository.count({ where: { role: 'admin' } });
    const schoolCount = await userRepository.count({ where: { role: 'school' } });
    const technicianCount = await userRepository.count({ where: { role: 'technician' } });
    const rtbStaffCount = await userRepository.count({ where: { role: 'rtb-staff' } });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        byRole: {
          admin: adminCount,
          school: schoolCount,
          technician: technicianCount,
          'rtb-staff': rtbStaffCount
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics'
    });
  }
};
