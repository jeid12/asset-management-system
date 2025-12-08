import { Response } from "express";
import { AppDataSource } from "../data-source";
import { Device } from "../entities/Device";
import { User } from "../entities/User";
import { School } from "../entities/School";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Not } from "typeorm";

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const user = req.user as any;
    
    console.log("Dashboard request - User:", user);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const deviceRepository = AppDataSource.getRepository(Device);
    const userRepository = AppDataSource.getRepository(User);
    const schoolRepository = AppDataSource.getRepository(School);
    
    // Fetch full user details from database
    const fullUser = await userRepository.findOne({
      where: { id: user.id }
    });
    
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let stats: any = {
      role: fullUser.role,
      user: {
        fullName: fullUser.fullName,
        email: fullUser.email,
        phoneNumber: fullUser.phoneNumber
      }
    };

    // Admin Dashboard
    if (fullUser.role === "admin") {
      // Device statistics
      const totalDevices = await deviceRepository.count();
      const devicesByCategory = await deviceRepository
        .createQueryBuilder("device")
        .select("device.category", "category")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.category")
        .getRawMany();

      const devicesByStatus = await deviceRepository
        .createQueryBuilder("device")
        .select("device.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.status")
        .getRawMany();

      const devicesByCondition = await deviceRepository
        .createQueryBuilder("device")
        .select("device.condition", "condition")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.condition")
        .getRawMany();

      // User statistics
      const totalUsers = await userRepository.count();
      const usersByRole = await userRepository
        .createQueryBuilder("user")
        .select("user.role", "role")
        .addSelect("COUNT(*)", "count")
        .groupBy("user.role")
        .getRawMany();

      // School statistics
      const totalSchools = await schoolRepository.count();
      const schoolsByDistrict = await schoolRepository
        .createQueryBuilder("school")
        .select("school.district", "district")
        .addSelect("COUNT(*)", "count")
        .groupBy("school.district")
        .getRawMany();

      const schoolsBySector = await schoolRepository
        .createQueryBuilder("school")
        .select("school.sector", "sector")
        .addSelect("COUNT(*)", "count")
        .groupBy("school.sector")
        .getRawMany();

      // Devices assigned to schools
      const devicesWithSchool = await deviceRepository.count({
        where: { schoolCode: Not(null) } as any
      });

      // Recent activities - last 5 devices added
      const recentDevices = await deviceRepository.find({
        order: { createdAt: "DESC" },
        take: 5,
        relations: ["school"]
      });

      stats = {
        ...stats,
        devices: {
          total: totalDevices,
          assigned: devicesWithSchool,
          unassigned: totalDevices - devicesWithSchool,
          byCategory: devicesByCategory.reduce((acc, item) => {
            acc[item.category] = parseInt(item.count);
            return acc;
          }, {} as any),
          byStatus: devicesByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {} as any),
          byCondition: devicesByCondition.reduce((acc, item) => {
            acc[item.condition] = parseInt(item.count);
            return acc;
          }, {} as any)
        },
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = parseInt(item.count);
            return acc;
          }, {} as any)
        },
        schools: {
          total: totalSchools,
          byDistrict: schoolsByDistrict.reduce((acc, item) => {
            acc[item.district] = parseInt(item.count);
            return acc;
          }, {} as any),
          bySector: schoolsBySector.slice(0, 10).reduce((acc, item) => {
            acc[item.sector] = parseInt(item.count);
            return acc;
          }, {} as any)
        },
        recentActivities: recentDevices.map(device => ({
          id: device.id,
          serialNumber: device.serialNumber,
          category: device.category,
          status: device.status,
          schoolName: device.school?.schoolName || "Not Assigned",
          createdAt: device.createdAt
        }))
      };
    }

    // RTB Staff Dashboard
    else if (fullUser.role === "rtb-staff") {
      const totalDevices = await deviceRepository.count();
      const devicesByStatus = await deviceRepository
        .createQueryBuilder("device")
        .select("device.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.status")
        .getRawMany();

      const devicesByCategory = await deviceRepository
        .createQueryBuilder("device")
        .select("device.category", "category")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.category")
        .getRawMany();

      const totalSchools = await schoolRepository.count();
      const devicesWithSchool = await deviceRepository.count({
        where: { schoolCode: Not(null) } as any
      });

      const recentDevices = await deviceRepository.find({
        order: { createdAt: "DESC" },
        take: 5,
        relations: ["school"]
      });

      stats = {
        ...stats,
        devices: {
          total: totalDevices,
          assigned: devicesWithSchool,
          unassigned: totalDevices - devicesWithSchool,
          byCategory: devicesByCategory.reduce((acc, item) => {
            acc[item.category] = parseInt(item.count);
            return acc;
          }, {} as any),
          byStatus: devicesByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {} as any)
        },
        schools: {
          total: totalSchools
        },
        recentActivities: recentDevices.map(device => ({
          id: device.id,
          serialNumber: device.serialNumber,
          category: device.category,
          status: device.status,
          schoolName: device.school?.schoolName || "Not Assigned",
          createdAt: device.createdAt
        }))
      };
    }

    // School Dashboard
    else if (fullUser.role === "school") {
      // Find the school where this user is the representative
      const school = await schoolRepository.findOne({
        where: { representativeId: fullUser.id }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          message: "No school assigned to this user. Please contact an administrator."
        });
      }

      const schoolDevices = await deviceRepository.find({
        where: { schoolCode: school.schoolCode },
        relations: ["school"]
      });

      const totalDevices = schoolDevices.length;

      const devicesByCategory = schoolDevices.reduce((acc, device) => {
        acc[device.category] = (acc[device.category] || 0) + 1;
        return acc;
      }, {} as any);

      const devicesByStatus = schoolDevices.reduce((acc, device) => {
        acc[device.status] = (acc[device.status] || 0) + 1;
        return acc;
      }, {} as any);

      const devicesByCondition = schoolDevices.reduce((acc, device) => {
        acc[device.condition] = (acc[device.condition] || 0) + 1;
        return acc;
      }, {} as any);

      const maintenanceDevices = schoolDevices.filter(d => d.status === "Maintenance");
      const availableDevices = schoolDevices.filter(d => d.status === "Available");

      stats = {
        ...stats,
        school: {
          schoolName: school.schoolName,
          schoolCode: school.schoolCode,
          district: school.district,
          sector: school.sector,
          phoneNumber: school.phoneNumber,
          email: school.email
        },
        devices: {
          total: totalDevices,
          available: availableDevices.length,
          maintenance: maintenanceDevices.length,
          byCategory: devicesByCategory,
          byStatus: devicesByStatus,
          byCondition: devicesByCondition
        },
        alerts: {
          maintenanceNeeded: maintenanceDevices.length,
          faultyDevices: schoolDevices.filter(d => d.condition === "Faulty").length
        },
        recentDevices: schoolDevices.slice(-5).reverse().map(device => ({
          id: device.id,
          serialNumber: device.serialNumber,
          category: device.category,
          brand: device.brand,
          model: device.model,
          status: device.status,
          condition: device.condition,
          assetTag: device.assetTag,
          createdAt: device.createdAt
        }))
      };
    }

    // Technician Dashboard
    else if (fullUser.role === "technician") {
      const maintenanceDevices = await deviceRepository.find({
        where: { status: "Maintenance" },
        relations: ["school"],
        order: { updatedAt: "DESC" }
      });

      const faultyDevices = await deviceRepository.find({
        where: { condition: "Faulty" },
        relations: ["school"],
        order: { updatedAt: "DESC" }
      });

      const totalDevices = await deviceRepository.count();
      const devicesByCondition = await deviceRepository
        .createQueryBuilder("device")
        .select("device.condition", "condition")
        .addSelect("COUNT(*)", "count")
        .groupBy("device.condition")
        .getRawMany();

      stats = {
        ...stats,
        devices: {
          total: totalDevices,
          maintenance: maintenanceDevices.length,
          faulty: faultyDevices.length,
          byCondition: devicesByCondition.reduce((acc, item) => {
            acc[item.condition] = parseInt(item.count);
            return acc;
          }, {} as any)
        },
        workload: {
          pendingMaintenance: maintenanceDevices.length,
          faultyDevices: faultyDevices.length,
          totalTasks: maintenanceDevices.length + faultyDevices.length
        },
        maintenanceQueue: maintenanceDevices.slice(0, 10).map(device => ({
          id: device.id,
          serialNumber: device.serialNumber,
          category: device.category,
          brand: device.brand,
          model: device.model,
          condition: device.condition,
          schoolName: device.school?.schoolName || "Not Assigned",
          assetTag: device.assetTag,
          updatedAt: device.updatedAt
        }))
      };
    }

    return res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
};
