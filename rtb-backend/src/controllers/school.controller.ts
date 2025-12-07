import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { School } from '../entities/School';
import { User } from '../entities/User';
import { CreateSchoolDto, UpdateSchoolDto, BulkCreateSchoolDto } from '../dtos/school.dto';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { AuthRequest } from '../middlewares/auth.middleware';

const schoolRepository = AppDataSource.getRepository(School);
const userRepository = AppDataSource.getRepository(User);

/**
 * Get all schools with pagination and filtering (Admin/Staff only)
 */
export const getSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const currentUser = authReq.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { search, category, province, district, status } = req.query;

    // Build query conditions
    const where: any = {};
    
    if (category) where.category = category;
    if (province) where.province = province;
    if (district) where.district = district;
    if (status) where.status = status;

    // If user is 'school' role, only show their assigned school(s)
    if (currentUser?.role === 'school') {
      where.representativeId = currentUser.id;
    }

    let query = schoolRepository
      .createQueryBuilder('school')
      .leftJoinAndSelect('school.representative', 'representative')
      .select([
        'school',
        'representative.id',
        'representative.fullName',
        'representative.username',
        'representative.email',
        'representative.role'
      ]);

    // Apply filters
    if (category) query = query.andWhere('school.category = :category', { category });
    if (province) query = query.andWhere('school.province = :province', { province });
    if (district) query = query.andWhere('school.district = :district', { district });
    if (status) query = query.andWhere('school.status = :status', { status });

    // School role restriction
    if (currentUser?.role === 'school') {
      query = query.andWhere('school.representativeId = :userId', { userId: currentUser.id });
    }

    // Search functionality
    if (search) {
      query = query.andWhere(
        '(school.schoolName LIKE :search OR school.schoolCode LIKE :search OR school.district LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [schools, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('school.createdAt', 'DESC')
      .getManyAndCount();

    return res.json({
      success: true,
      data: schools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get schools error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve schools'
    });
  }
};

/**
 * Get school by ID
 */
export const getSchoolById = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const currentUser = authReq.user;
    const { schoolId } = req.params;

    const school = await schoolRepository.findOne({
      where: { id: schoolId },
      relations: ['representative']
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // School role can only view their own school
    if (currentUser?.role === 'school' && school.representativeId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your assigned school.'
      });
    }

    return res.json({
      success: true,
      data: school
    });
  } catch (error) {
    console.error('Get school by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve school'
    });
  }
};

/**
 * Create a single school (Admin/Staff only)
 */
export const createSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const createDto = plainToClass(CreateSchoolDto, req.body);
    const errors = await validate(createDto);

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

    // Check if school code already exists
    const existingSchool = await schoolRepository.findOne({
      where: { schoolCode: createDto.schoolCode }
    });

    if (existingSchool) {
      return res.status(409).json({
        success: false,
        message: 'School code already exists'
      });
    }

    // If representativeId provided, validate the user
    if (createDto.representativeId) {
      const representative = await userRepository.findOne({
        where: { id: createDto.representativeId }
      });

      if (!representative) {
        return res.status(404).json({
          success: false,
          message: 'Representative user not found'
        });
      }

      if (representative.role !== 'school') {
        return res.status(400).json({
          success: false,
          message: 'Representative must have "school" role'
        });
      }
    }

    const school = schoolRepository.create(createDto);
    await schoolRepository.save(school);

    // Fetch with representative details
    const savedSchool = await schoolRepository.findOne({
      where: { id: school.id },
      relations: ['representative']
    });

    return res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: savedSchool
    });
  } catch (error) {
    console.error('Create school error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create school'
    });
  }
};

/**
 * Bulk create schools (Admin/Staff only)
 */
export const bulkCreateSchools = async (req: Request, res: Response): Promise<void> => {
  try {
    const bulkDto = plainToClass(BulkCreateSchoolDto, req.body);
    const errors = await validate(bulkDto);

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

    const results = {
      successful: [] as any[],
      failed: [] as any[]
    };

    for (const schoolData of bulkDto.schools) {
      try {
        // Check for duplicate school code
        const existing = await schoolRepository.findOne({
          where: { schoolCode: schoolData.schoolCode }
        });

        if (existing) {
          results.failed.push({
            schoolCode: schoolData.schoolCode,
            reason: 'School code already exists'
          });
          continue;
        }

        // Validate representative if provided
        if (schoolData.representativeId) {
          const representative = await userRepository.findOne({
            where: { id: schoolData.representativeId }
          });

          if (!representative) {
            results.failed.push({
              schoolCode: schoolData.schoolCode,
              reason: 'Representative user not found'
            });
            continue;
          }

          if (representative.role !== 'school') {
            results.failed.push({
              schoolCode: schoolData.schoolCode,
              reason: 'Representative must have "school" role'
            });
            continue;
          }
        }

        const school = schoolRepository.create(schoolData);
        await schoolRepository.save(school);
        results.successful.push(school);
      } catch (error: any) {
        results.failed.push({
          schoolCode: schoolData.schoolCode,
          reason: error.message || 'Unknown error'
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: `Bulk import completed. ${results.successful.length} succeeded, ${results.failed.length} failed.`,
      data: results
    });
  } catch (error) {
    console.error('Bulk create schools error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bulk create schools'
    });
  }
};

/**
 * Update school (Admin/Staff can update all fields, School role can update limited fields)
 */
export const updateSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const currentUser = authReq.user;
    const { schoolId } = req.params;

    const school = await schoolRepository.findOne({
      where: { id: schoolId }
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // School role can only update their own school
    if (currentUser?.role === 'school') {
      if (school.representativeId !== currentUser.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your assigned school.'
        });
      }

      // School role has limited update permissions
      const allowedFields = ['email', 'phoneNumber', 'address'];
      const requestedFields = Object.keys(req.body);
      const invalidFields = requestedFields.filter(field => !allowedFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(403).json({
          success: false,
          message: `You can only update: ${allowedFields.join(', ')}`
        });
      }
    }

    const updateDto = plainToClass(UpdateSchoolDto, req.body);
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

    // If representativeId is being updated, validate
    if (updateDto.representativeId !== undefined) {
      if (currentUser?.role === 'school') {
        return res.status(403).json({
          success: false,
          message: 'You cannot change the school representative'
        });
      }

      if (updateDto.representativeId) {
        const representative = await userRepository.findOne({
          where: { id: updateDto.representativeId }
        });

        if (!representative) {
          return res.status(404).json({
            success: false,
            message: 'Representative user not found'
          });
        }

        if (representative.role !== 'school') {
          return res.status(400).json({
            success: false,
            message: 'Representative must have "school" role'
          });
        }
      }
    }

    Object.assign(school, updateDto);
    await schoolRepository.save(school);

    const updatedSchool = await schoolRepository.findOne({
      where: { id: school.id },
      relations: ['representative']
    });

    return res.json({
      success: true,
      message: 'School updated successfully',
      data: updatedSchool
    });
  } catch (error) {
    console.error('Update school error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update school'
    });
  }
};

/**
 * Delete school (Admin/Staff only)
 */
export const deleteSchool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { schoolId } = req.params;

    const school = await schoolRepository.findOne({
      where: { id: schoolId }
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    await schoolRepository.remove(school);

    return res.json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Delete school error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete school'
    });
  }
};

/**
 * Get school statistics (Admin/Staff only)
 */
export const getSchoolStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalSchools = await schoolRepository.count();
    const activeSchools = await schoolRepository.count({ where: { status: 'Active' } });
    const inactiveSchools = await schoolRepository.count({ where: { status: 'Inactive' } });
    const tssCount = await schoolRepository.count({ where: { category: 'TSS' } });
    const vtcCount = await schoolRepository.count({ where: { category: 'VTC' } });
    const otherCount = await schoolRepository.count({ where: { category: 'Other' } });
    const withRepresentative = await schoolRepository
      .createQueryBuilder('school')
      .where('school.representativeId IS NOT NULL')
      .getCount();
    const withoutRepresentative = totalSchools - withRepresentative;

    return res.json({
      success: true,
      data: {
        total: totalSchools,
        active: activeSchools,
        inactive: inactiveSchools,
        byCategory: {
          TSS: tssCount,
          VTC: vtcCount,
          Other: otherCount
        },
        representatives: {
          assigned: withRepresentative,
          unassigned: withoutRepresentative
        }
      }
    });
  } catch (error) {
    console.error('Get school stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve school statistics'
    });
  }
};
