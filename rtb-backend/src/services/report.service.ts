// src/services/report.service.ts
import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Device } from "../entities/Device";
import { DeviceApplication } from "../entities/DeviceApplication";
import { User } from "../entities/User";
import { School } from "../entities/School";
import { AuditLog } from "../entities/AuditLog";
import { Notification } from "../entities/Notification";
import { ReportFilterDto, ReportType } from "../dtos/report.dto";

export class ReportService {
  private deviceRepository: Repository<Device>;
  private applicationRepository: Repository<DeviceApplication>;
  private userRepository: Repository<User>;
  private schoolRepository: Repository<School>;
  private auditLogRepository: Repository<AuditLog>;
  private notificationRepository: Repository<Notification>;

  constructor() {
    this.deviceRepository = AppDataSource.getRepository(Device);
    this.applicationRepository = AppDataSource.getRepository(DeviceApplication);
    this.userRepository = AppDataSource.getRepository(User);
    this.schoolRepository = AppDataSource.getRepository(School);
    this.auditLogRepository = AppDataSource.getRepository(AuditLog);
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }

  /**
   * Generate report data based on user role and filters
   */
  async generateReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    switch (filters.reportType) {
      case ReportType.DEVICES:
        return this.generateDeviceReport(filters, userId, userRole);
      case ReportType.APPLICATIONS:
        return this.generateApplicationReport(filters, userId, userRole);
      case ReportType.USERS:
        return this.generateUserReport(filters, userId, userRole);
      case ReportType.SCHOOLS:
        return this.generateSchoolReport(filters, userId, userRole);
      case ReportType.AUDIT_LOGS:
        return this.generateAuditLogReport(filters, userId, userRole);
      case ReportType.NOTIFICATIONS:
        return this.generateNotificationReport(filters, userId, userRole);
      default:
        throw new Error("Invalid report type");
    }
  }

  /**
   * Generate Device Report
   */
  private async generateDeviceReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    const queryBuilder = this.deviceRepository
      .createQueryBuilder("device")
      .leftJoinAndSelect("device.school", "school");

    // Role-based filtering - skip for now since User doesn't have schoolCode relation
    // Admin and staff can see all devices
    // School users would need implementation of school-user relationship

    // Apply filters
    if (filters.deviceType) {
      queryBuilder.andWhere("device.category = :category", {
        category: filters.deviceType,
      });
    }

    if (filters.deviceStatus) {
      queryBuilder.andWhere("device.status = :status", {
        status: filters.deviceStatus,
      });
    }

    if (filters.assignedToSchoolId) {
      queryBuilder.andWhere("device.schoolCode = :schoolCode", {
        schoolCode: filters.assignedToSchoolId,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("device.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`device.${sortBy}`, sortOrder);

    // Execute query
    const devices = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalDevices: devices.length,
      availableDevices: devices.filter((d) => d.status === "Available").length,
      assignedDevices: devices.filter((d) => d.status === "Assigned").length,
      maintenanceDevices: devices.filter((d) => d.status === "Maintenance").length,
      writtenOffDevices: devices.filter((d) => d.status === "Written Off").length,
      devicesByCategory: this.groupByField(devices, "category"),
      devicesBySchool: this.groupByField(
        devices.filter((d) => d.school),
        "school.schoolName"
      ),
    };

    return {
      data: devices.map((device) => this.formatDeviceForReport(device)),
      summary,
      metadata: {
        reportType: ReportType.DEVICES,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  /**
   * Generate Application Report
   */
  private async generateApplicationReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.school", "school");

    // Role-based filtering - school users see their own applications
    if (userRole === "school" || userRole === "headteacher" || userRole === "school-staff") {
      queryBuilder.andWhere("application.applicantId = :userId", {
        userId,
      });
    }

    // Apply filters
    if (filters.applicationStatus) {
      queryBuilder.andWhere("application.status = :status", {
        status: filters.applicationStatus,
      });
    }

    if (filters.schoolId) {
      queryBuilder.andWhere("application.schoolId = :schoolId", {
        schoolId: filters.schoolId,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("application.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`application.${sortBy}`, sortOrder);

    const applications = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === "Pending").length,
      underReviewApplications: applications.filter((a) => a.status === "Under Review").length,
      approvedApplications: applications.filter((a) => a.status === "Approved").length,
      rejectedApplications: applications.filter((a) => a.status === "Rejected").length,
      assignedApplications: applications.filter((a) => a.status === "Assigned").length,
      receivedApplications: applications.filter((a) => a.status === "Received").length,
      cancelledApplications: applications.filter((a) => a.status === "Cancelled").length,
      applicationsBySchool: this.groupByField(applications, "school.schoolName"),
      totalLaptopsRequested: applications.reduce((sum, a) => sum + a.requestedLaptops, 0),
      totalDesktopsRequested: applications.reduce((sum, a) => sum + a.requestedDesktops, 0),
      totalTabletsRequested: applications.reduce((sum, a) => sum + a.requestedTablets, 0),
      totalProjectorsRequested: applications.reduce((sum, a) => sum + a.requestedProjectors, 0),
    };

    return {
      data: applications.map((app) => this.formatApplicationForReport(app)),
      summary,
      metadata: {
        reportType: ReportType.APPLICATIONS,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  /**
   * Generate User Report (Admin/Staff only)
   */
  private async generateUserReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    // Only admin and staff can generate user reports
    if (userRole !== "admin" && userRole !== "rtb-staff") {
      throw new Error("Unauthorized: Insufficient permissions to generate user reports");
    }

    const queryBuilder = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.school", "school");

    // Apply filters
    if (filters.userRole) {
      queryBuilder.andWhere("user.role = :role", { role: filters.userRole });
    }

    if (filters.schoolId) {
      queryBuilder.andWhere("user.schoolCode = :schoolCode", {
        schoolCode: filters.schoolId,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("user.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    const users = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalUsers: users.length,
      usersByRole: this.groupByField(users, "role"),
      usersByGender: this.groupByField(users, "gender"),
    };

    return {
      data: users.map((user) => this.formatUserForReport(user)),
      summary,
      metadata: {
        reportType: ReportType.USERS,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  /**
   * Generate School Report
   */
  private async generateSchoolReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    const queryBuilder = this.schoolRepository
      .createQueryBuilder("school")
      .loadRelationCountAndMap("school.userCount", "school.users")
      .loadRelationCountAndMap("school.deviceCount", "school.devices")
      .loadRelationCountAndMap("school.applicationCount", "school.applications");

    // Role-based filtering - school users see their own school only
    if (userRole === "school" || userRole === "headteacher" || userRole === "school-staff") {
      // For now, allow all schools since we don't have user-school relationship
      // This would need to be implemented based on your user-school association
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("school.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "name";
    const sortOrder = filters.sortOrder || "ASC";
    queryBuilder.orderBy(`school.${sortBy}`, sortOrder);

    const schools = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalSchools: schools.length,
      schoolsByCategory: this.groupByField(schools, "category"),
      schoolsByProvince: this.groupByField(schools, "province"),
      schoolsByDistrict: this.groupByField(schools, "district"),
    };

    return {
      data: schools.map((school) => this.formatSchoolForReport(school)),
      summary,
      metadata: {
        reportType: ReportType.SCHOOLS,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  /**
   * Generate Audit Log Report (Admin only)
   */
  private async generateAuditLogReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    // Only admin can generate audit log reports
    if (userRole !== "admin") {
      throw new Error("Unauthorized: Insufficient permissions to generate audit log reports");
    }

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder("auditLog")
      .leftJoinAndSelect("auditLog.actor", "actor");

    // Apply filters
    if (filters.actionType) {
      queryBuilder.andWhere("auditLog.actionType = :actionType", {
        actionType: filters.actionType,
      });
    }

    if (filters.actorId) {
      queryBuilder.andWhere("auditLog.actorId = :actorId", {
        actorId: filters.actorId,
      });
    }

    if (filters.targetEntity) {
      queryBuilder.andWhere("auditLog.targetEntity = :targetEntity", {
        targetEntity: filters.targetEntity,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("auditLog.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`auditLog.${sortBy}`, sortOrder);

    const auditLogs = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalLogs: auditLogs.length,
      logsByAction: this.groupByField(auditLogs, "actionType"),
      logsByEntity: this.groupByField(auditLogs, "targetEntity"),
      uniqueActors: new Set(auditLogs.map((log) => log.actorId)).size,
      avgExecutionTime:
        auditLogs.reduce((sum, log) => sum + (log.executionDuration || 0), 0) /
        auditLogs.length || 0,
    };

    return {
      data: auditLogs.map((log) => this.formatAuditLogForReport(log)),
      summary,
      metadata: {
        reportType: ReportType.AUDIT_LOGS,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  /**
   * Generate Notification Report
   */
  private async generateNotificationReport(
    filters: ReportFilterDto,
    userId: string,
    userRole: string
  ): Promise<any> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.user", "user");

    // Role-based filtering
    if (userRole !== "admin" && userRole !== "rtb-staff") {
      queryBuilder.andWhere("notification.userId = :userId", { userId });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere("notification.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(filters.startDate),
        endDate: new Date(filters.endDate),
      });
    }

    // Sorting
    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "DESC";
    queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);

    const notifications = await queryBuilder.getMany();

    // Generate summary statistics
    const summary = {
      totalNotifications: notifications.length,
      readNotifications: notifications.filter((n) => n.isRead).length,
      unreadNotifications: notifications.filter((n) => !n.isRead).length,
      notificationsByType: this.groupByField(notifications, "type"),
    };

    return {
      data: notifications.map((notification) => this.formatNotificationForReport(notification)),
      summary,
      metadata: {
        reportType: ReportType.NOTIFICATIONS,
        generatedAt: new Date().toISOString(),
        generatedBy: userId,
        userRole,
        filters,
      },
    };
  }

  // Helper methods for formatting
  private formatDeviceForReport(device: Device): any {
    return {
      id: device.id,
      serialNumber: device.serialNumber,
      category: device.category,
      brand: device.brand,
      model: device.model,
      status: device.status,
      condition: device.condition,
      assetTag: device.assetTag || "N/A",
      assignedToSchool: device.school?.schoolName || "Not Assigned",
      schoolCode: device.schoolCode || null,
      createdAt: device.createdAt,
    };
  }

  private formatApplicationForReport(application: DeviceApplication): any {
    const totalRequested = 
      application.requestedLaptops +
      application.requestedDesktops +
      application.requestedTablets +
      application.requestedProjectors +
      application.requestedOthers;

    return {
      id: application.id,
      schoolName: application.school?.schoolName || "Unknown",
      requestedLaptops: application.requestedLaptops,
      requestedDesktops: application.requestedDesktops,
      requestedTablets: application.requestedTablets,
      requestedProjectors: application.requestedProjectors,
      requestedOthers: application.requestedOthers,
      totalDevicesRequested: totalRequested,
      purpose: application.purpose,
      justification: application.justification || "N/A",
      status: application.status,
      assignedDevicesCount: application.assignedDevices?.length || 0,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    };
  }

  private formatUserForReport(user: User): any {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      gender: user.gender || "Not Specified",
      createdAt: user.createdAt,
    };
  }

  private formatSchoolForReport(school: School): any {
    return {
      id: school.id,
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      category: school.category,
      province: school.province,
      district: school.district,
      sector: school.sector,
      email: school.email || "N/A",
      phoneNumber: school.phoneNumber || "N/A",
      status: school.status,
      createdAt: school.createdAt,
    };
  }

  private formatAuditLogForReport(log: AuditLog): any {
    return {
      id: log.id,
      actorName: log.actorName || "Unknown",
      actionType: log.actionType,
      targetEntity: log.targetEntity,
      targetId: log.targetId,
      ipAddress: log.ipAddress,
      executionDuration: log.executionDuration,
      createdAt: log.createdAt,
    };
  }

  private formatNotificationForReport(notification: Notification): any {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      userId: notification.userId,
      userName: notification.user?.fullName || "Unknown",
      createdAt: notification.createdAt,
    };
  }

  // Helper method to group data by field
  private groupByField(data: any[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    data.forEach((item) => {
      const keys = field.split(".");
      let value = item;
      for (const key of keys) {
        value = value?.[key];
      }
      const key = value || "Unknown";
      result[key] = (result[key] || 0) + 1;
    });
    return result;
  }
}
