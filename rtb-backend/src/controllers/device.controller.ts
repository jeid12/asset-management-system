import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Device } from "../entities/Device";
import { School } from "../entities/School";
import { CreateDeviceDto, UpdateDeviceDto, BulkCreateDeviceDto, BulkAssignDeviceDto } from "../dtos/device.dto";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getDevices = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const deviceRepository = AppDataSource.getRepository(Device);
    const user = req.user;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const schoolCode = req.query.schoolCode as string;

    const queryBuilder = deviceRepository.createQueryBuilder("device")
      .leftJoinAndSelect("device.school", "school");

    // Filter by school for school role
    if (user?.role === "school") {
      // School users can only see their assigned devices
      const schoolRepository = AppDataSource.getRepository(School);
      const school = await schoolRepository.findOne({
        where: { representative: { id: user.id } }
      });
      
      if (school) {
        queryBuilder.andWhere("device.schoolCode = :schoolCode", { schoolCode: school.schoolCode });
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 }
        });
      }
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere(
        "(device.serialNumber LIKE :search OR device.brand LIKE :search OR device.model LIKE :search OR device.assetTag LIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Category filter
    if (category) {
      queryBuilder.andWhere("device.category = :category", { category });
    }

    // Status filter
    if (status) {
      queryBuilder.andWhere("device.status = :status", { status });
    }

    // School filter
    if (schoolCode) {
      queryBuilder.andWhere("device.schoolCode = :schoolCode", { schoolCode });
    }

    const total = await queryBuilder.getCount();
    const devices = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy("device.createdAt", "DESC")
      .getMany();

    return res.status(200).json({
      success: true,
      data: devices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Get devices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch devices",
      error: error.message
    });
  }
};

export const getDeviceById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deviceRepository = AppDataSource.getRepository(Device);
    const user = req.user;

    const device = await deviceRepository.findOne({
      where: { id },
      relations: ["school"]
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    // School users can only view devices assigned to their school
    if (user?.role === "school") {
      const schoolRepository = AppDataSource.getRepository(School);
      const school = await schoolRepository.findOne({
        where: { representative: { id: user.id } }
      });

      if (!school || device.schoolCode !== school.schoolCode) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You can only view devices assigned to your school."
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: device
    });
  } catch (error: any) {
    console.error("Get device by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch device",
      error: error.message
    });
  }
};

export const createDevice = async (req: Request, res: Response): Promise<Response> => {
  try {
    const dto = plainToClass(CreateDeviceDto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.map(err => Object.values(err.constraints || {})).flat()
      });
    }

    const deviceRepository = AppDataSource.getRepository(Device);
    const schoolRepository = AppDataSource.getRepository(School);

    // Check if serial number already exists
    const existingDevice = await deviceRepository.findOne({
      where: { serialNumber: dto.serialNumber }
    });

    if (existingDevice) {
      return res.status(400).json({
        success: false,
        message: "Device with this serial number already exists"
      });
    }

    // Normalize empty string to null for schoolCode
    if (dto.schoolCode === "" || dto.schoolCode === undefined) {
      dto.schoolCode = undefined;
    }

    // Validate school code if provided and generate asset tag
    if (dto.schoolCode) {
      const school = await schoolRepository.findOne({
        where: { schoolCode: dto.schoolCode }
      });

      if (!school) {
        return res.status(400).json({
          success: false,
          message: `School with code ${dto.schoolCode} not found`
        });
      }

      // If assigning to school, status should be "Assigned"
      if (dto.status === "Available") {
        dto.status = "Assigned";
      }

      // Auto-generate asset tag
      const existingDevices = await deviceRepository.find({
        where: { schoolCode: dto.schoolCode }
      });
      
      let maxSequence = 0;
      existingDevices.forEach(device => {
        if (device.assetTag) {
          const parts = device.assetTag.split('/');
          if (parts.length === 4) {
            const num = parseInt(parts[3]);
            if (!isNaN(num) && num > maxSequence) {
              maxSequence = num;
            }
          }
        }
      });

      const categoryCode = dto.category.substring(0, 3).toUpperCase();
      const districtCode = school.district.substring(0, 3).toUpperCase();
      const schoolCode = school.schoolName.substring(0, 3).toUpperCase();
      dto.assetTag = `${categoryCode}/${districtCode}/${schoolCode}/${String(maxSequence + 1).padStart(4, '0')}`;
    } else {
      // If no school, status should be "Available"
      if (dto.status === "Assigned") {
        dto.status = "Available";
      }
    }

    const device = deviceRepository.create(dto);
    const savedDevice = await deviceRepository.save(device);

    return res.status(201).json({
      success: true,
      message: "Device created successfully",
      data: savedDevice
    });
  } catch (error: any) {
    console.error("Create device error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create device",
      error: error.message
    });
  }
};

export const bulkCreateDevices = async (req: Request, res: Response): Promise<Response> => {
  try {
    const dto = plainToClass(BulkCreateDeviceDto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.map(err => Object.values(err.constraints || {})).flat()
      });
    }

    const deviceRepository = AppDataSource.getRepository(Device);
    const schoolRepository = AppDataSource.getRepository(School);

    const successful: any[] = [];
    const failed: any[] = [];

    for (const deviceData of dto.devices) {
      try {
        // Check if serial number already exists
        const existingDevice = await deviceRepository.findOne({
          where: { serialNumber: deviceData.serialNumber }
        });

        if (existingDevice) {
          failed.push({
            serialNumber: deviceData.serialNumber,
            reason: "Serial number already exists"
          });
          continue;
        }

        // Normalize empty string to null for schoolCode
        if (deviceData.schoolCode === "" || deviceData.schoolCode === undefined) {
          deviceData.schoolCode = undefined;
        }

        // Validate school code if provided and generate asset tag
        if (deviceData.schoolCode) {
          const school = await schoolRepository.findOne({
            where: { schoolCode: deviceData.schoolCode }
          });

          if (!school) {
            failed.push({
              serialNumber: deviceData.serialNumber,
              reason: `School code ${deviceData.schoolCode} not found`
            });
            continue;
          }

          // Auto-set status to Assigned if school is provided
          if (deviceData.status === "Available") {
            deviceData.status = "Assigned";
          }

          // Auto-generate asset tag
          const existingDevices = await deviceRepository.find({
            where: { schoolCode: deviceData.schoolCode }
          });
          
          let maxSequence = 0;
          existingDevices.forEach(device => {
            if (device.assetTag) {
              const parts = device.assetTag.split('/');
              if (parts.length === 4) {
                const num = parseInt(parts[3]);
                if (!isNaN(num) && num > maxSequence) {
                  maxSequence = num;
                }
              }
            }
          });

          const categoryCode = deviceData.category.substring(0, 3).toUpperCase();
          const districtCode = school.district.substring(0, 3).toUpperCase();
          const schoolCode = school.schoolName.substring(0, 3).toUpperCase();
          deviceData.assetTag = `${categoryCode}/${districtCode}/${schoolCode}/${String(maxSequence + 1).padStart(4, '0')}`;
        } else {
          // Auto-set status to Available if no school
          if (deviceData.status === "Assigned") {
            deviceData.status = "Available";
          }
        }

        const device = deviceRepository.create(deviceData);
        const savedDevice = await deviceRepository.save(device);
        successful.push(savedDevice);
      } catch (error: any) {
        failed.push({
          serialNumber: deviceData.serialNumber,
          reason: error.message || "Unknown error"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk create completed: ${successful.length} successful, ${failed.length} failed`,
      data: { successful, failed }
    });
  } catch (error: any) {
    console.error("Bulk create devices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk create devices",
      error: error.message
    });
  }
};

export const bulkAssignDevices = async (req: Request, res: Response): Promise<Response> => {
  try {
    const dto = plainToClass(BulkAssignDeviceDto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.map(err => Object.values(err.constraints || {})).flat()
      });
    }

    const deviceRepository = AppDataSource.getRepository(Device);
    const schoolRepository = AppDataSource.getRepository(School);

    // Validate school exists
    const school = await schoolRepository.findOne({
      where: { schoolCode: dto.schoolCode }
    });

    if (!school) {
      return res.status(400).json({
        success: false,
        message: `School with code ${dto.schoolCode} not found`
      });
    }

    // Helper function to generate asset tag
    const generateAssetTag = async (device: Device, school: any, sequenceNumber: number): Promise<string> => {
      // Get first 3 letters of category
      const categoryCode = device.category.substring(0, 3).toUpperCase();
      
      // Get first 3 letters of district
      const districtCode = school.district.substring(0, 3).toUpperCase();
      
      // Get first 3 letters of school name
      const schoolCode = school.schoolName.substring(0, 3).toUpperCase();
      
      // Format: CAT/DIS/SCH/0001
      return `${categoryCode}/${districtCode}/${schoolCode}/${String(sequenceNumber).padStart(4, '0')}`;
    };

    // Get the current max sequence number for this school
    const existingDevices = await deviceRepository.find({
      where: { schoolCode: dto.schoolCode }
    });
    
    let maxSequence = 0;
    existingDevices.forEach(device => {
      if (device.assetTag) {
        const parts = device.assetTag.split('/');
        if (parts.length === 4) {
          const num = parseInt(parts[3]);
          if (!isNaN(num) && num > maxSequence) {
            maxSequence = num;
          }
        }
      }
    });

    const successful: any[] = [];
    const failed: any[] = [];

    for (let i = 0; i < dto.serialNumbers.length; i++) {
      const serialNumber = dto.serialNumbers[i];
      try {
        const device = await deviceRepository.findOne({
          where: { serialNumber }
        });

        if (!device) {
          failed.push({
            serialNumber,
            reason: "Device not found"
          });
          continue;
        }

        if (device.schoolCode && device.schoolCode !== dto.schoolCode) {
          failed.push({
            serialNumber,
            reason: `Already assigned to school ${device.schoolCode}`
          });
          continue;
        }

        // Update device
        device.schoolCode = dto.schoolCode;
        device.status = "Assigned";
        
        // Generate asset tag automatically
        maxSequence++;
        device.assetTag = await generateAssetTag(device, school, maxSequence);

        const updatedDevice = await deviceRepository.save(device);
        successful.push(updatedDevice);
      } catch (error: any) {
        failed.push({
          serialNumber,
          reason: error.message || "Unknown error"
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk assign completed: ${successful.length} successful, ${failed.length} failed`,
      data: { successful, failed }
    });
  } catch (error: any) {
    console.error("Bulk assign devices error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to bulk assign devices",
      error: error.message
    });
  }
};

export const updateDevice = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const dto = plainToClass(UpdateDeviceDto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.map(err => Object.values(err.constraints || {})).flat()
      });
    }

    const deviceRepository = AppDataSource.getRepository(Device);
    const schoolRepository = AppDataSource.getRepository(School);

    const device = await deviceRepository.findOne({ where: { id } });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    // Check serial number uniqueness if being updated
    if (dto.serialNumber && dto.serialNumber !== device.serialNumber) {
      const existing = await deviceRepository.findOne({
        where: { serialNumber: dto.serialNumber }
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Device with this serial number already exists"
        });
      }
    }

    // Validate school code if being updated
    if (dto.schoolCode !== undefined) {
      // Normalize empty string to null
      if (dto.schoolCode === "") {
        dto.schoolCode = undefined;
      }
      
      if (dto.schoolCode) {
        const school = await schoolRepository.findOne({
          where: { schoolCode: dto.schoolCode }
        });

        if (!school) {
          return res.status(400).json({
            success: false,
            message: `School with code ${dto.schoolCode} not found`
          });
        }

        // Generate asset tag if school is being assigned and device doesn't have one yet
        // or if school is changing
        if (!device.assetTag || device.schoolCode !== dto.schoolCode) {
          const existingDevices = await deviceRepository.find({
            where: { schoolCode: dto.schoolCode }
          });
          
          let maxSequence = 0;
          existingDevices.forEach(d => {
            if (d.assetTag && d.id !== device.id) {
              const parts = d.assetTag.split('/');
              if (parts.length === 4) {
                const num = parseInt(parts[3]);
                if (!isNaN(num) && num > maxSequence) {
                  maxSequence = num;
                }
              }
            }
          });

          const categoryCode = (dto.category || device.category).substring(0, 3).toUpperCase();
          const districtCode = school.district.substring(0, 3).toUpperCase();
          const schoolCode = school.schoolName.substring(0, 3).toUpperCase();
          dto.assetTag = `${categoryCode}/${districtCode}/${schoolCode}/${String(maxSequence + 1).padStart(4, '0')}`;
        }
      } else {
        // If school is being removed, clear the asset tag
        dto.assetTag = undefined;
      }
    }

    Object.assign(device, dto);
    const updatedDevice = await deviceRepository.save(device);

    return res.status(200).json({
      success: true,
      message: "Device updated successfully",
      data: updatedDevice
    });
  } catch (error: any) {
    console.error("Update device error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update device",
      error: error.message
    });
  }
};

export const deleteDevice = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const deviceRepository = AppDataSource.getRepository(Device);

    const device = await deviceRepository.findOne({ where: { id } });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    await deviceRepository.remove(device);

    return res.status(200).json({
      success: true,
      message: "Device deleted successfully"
    });
  } catch (error: any) {
    console.error("Delete device error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete device",
      error: error.message
    });
  }
};

export const getDeviceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const deviceRepository = AppDataSource.getRepository(Device);
    const user = req.user;

    let queryBuilder = deviceRepository.createQueryBuilder("device");

    // Filter by school for school role
    if (user?.role === "school") {
      const schoolRepository = AppDataSource.getRepository(School);
      const school = await schoolRepository.findOne({
        where: { representative: { id: user.id } }
      });
      
      if (school) {
        queryBuilder = queryBuilder.where("device.schoolCode = :schoolCode", { schoolCode: school.schoolCode });
      } else {
        return res.status(200).json({
          success: true,
          data: {
            total: 0,
            byStatus: { Available: 0, Assigned: 0, Maintenance: 0, "Written Off": 0 },
            byCategory: { Laptop: 0, Desktop: 0, Tablet: 0, Projector: 0, Others: 0 },
            byCondition: { New: 0, Good: 0, Fair: 0, Faulty: 0 }
          }
        });
      }
    }

    const total = await queryBuilder.getCount();

    // Status statistics
    const byStatus = {
      Available: await queryBuilder.clone().andWhere("device.status = :status", { status: "Available" }).getCount(),
      Assigned: await queryBuilder.clone().andWhere("device.status = :status", { status: "Assigned" }).getCount(),
      Maintenance: await queryBuilder.clone().andWhere("device.status = :status", { status: "Maintenance" }).getCount(),
      "Written Off": await queryBuilder.clone().andWhere("device.status = :status", { status: "Written Off" }).getCount()
    };

    // Category statistics
    const byCategory = {
      Laptop: await queryBuilder.clone().andWhere("device.category = :category", { category: "Laptop" }).getCount(),
      Desktop: await queryBuilder.clone().andWhere("device.category = :category", { category: "Desktop" }).getCount(),
      Tablet: await queryBuilder.clone().andWhere("device.category = :category", { category: "Tablet" }).getCount(),
      Projector: await queryBuilder.clone().andWhere("device.category = :category", { category: "Projector" }).getCount(),
      Others: await queryBuilder.clone().andWhere("device.category = :category", { category: "Others" }).getCount()
    };

    // Condition statistics
    const byCondition = {
      New: await queryBuilder.clone().andWhere("device.condition = :condition", { condition: "New" }).getCount(),
      Good: await queryBuilder.clone().andWhere("device.condition = :condition", { condition: "Good" }).getCount(),
      Fair: await queryBuilder.clone().andWhere("device.condition = :condition", { condition: "Fair" }).getCount(),
      Faulty: await queryBuilder.clone().andWhere("device.condition = :condition", { condition: "Faulty" }).getCount()
    };

    return res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byCategory,
        byCondition
      }
    });
  } catch (error: any) {
    console.error("Get device stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch device statistics",
      error: error.message
    });
  }
};
