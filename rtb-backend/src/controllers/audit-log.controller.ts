// src/controllers/audit-log.controller.ts
import { Response } from "express";
import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";
import { AuthRequest } from "../middlewares/auth.middleware";
import { Between } from "typeorm";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

// Get all audit logs with filters and pagination (Admin only)
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      actionType,
      targetEntity,
      actorId,
      startDate,
      endDate,
      searchTerm,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = auditLogRepository
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.actor", "actor")
      .skip(skip)
      .take(limitNum);

    // Apply filters
    if (actionType) {
      queryBuilder.andWhere("log.actionType = :actionType", { actionType });
    }

    if (targetEntity) {
      queryBuilder.andWhere("log.targetEntity = :targetEntity", { targetEntity });
    }

    if (actorId) {
      queryBuilder.andWhere("log.actorId = :actorId", { actorId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere("log.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        "(log.actorName ILIKE :searchTerm OR log.actionDescription ILIKE :searchTerm OR log.targetName ILIKE :searchTerm OR log.ipAddress ILIKE :searchTerm)",
        { searchTerm: `%${searchTerm}%` }
      );
    }

    // Apply sorting
    const validSortFields = ["createdAt", "actionType", "executionDuration", "actorName"];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : "createdAt";
    queryBuilder.orderBy(`log.${sortField}`, sortOrder === "ASC" ? "ASC" : "DESC");

    const [logs, total] = await queryBuilder.getManyAndCount();

    // Calculate statistics
    const stats = await auditLogRepository
      .createQueryBuilder("log")
      .select("log.actionType", "actionType")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.actionType")
      .getRawMany();

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      stats,
    });
  } catch (error: any) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// Get single audit log details (Admin only)
export const getAuditLogById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await auditLogRepository.findOne({
      where: { id },
      relations: ["actor"],
    });

    if (!log) {
      res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
      return;
    }

    res.json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error("Get audit log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};

// Get audit log statistics (Admin only)
export const getAuditLogStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: Between(
          new Date(startDate as string),
          new Date(endDate as string)
        ),
      };
    }

    // Total logs
    const totalLogs = await auditLogRepository.count({ where: dateFilter });

    // Success vs failure rate
    const successCount = await auditLogRepository.count({
      where: { ...dateFilter, isSuccess: true },
    });
    const failureCount = await auditLogRepository.count({
      where: { ...dateFilter, isSuccess: false },
    });

    // Average execution duration
    const avgDuration = await auditLogRepository
      .createQueryBuilder("log")
      .select("AVG(log.executionDuration)", "avg")
      .where(dateFilter)
      .getRawOne();

    // Action type breakdown
    const actionBreakdown = await auditLogRepository
      .createQueryBuilder("log")
      .select("log.actionType", "actionType")
      .addSelect("COUNT(*)", "count")
      .where(dateFilter)
      .groupBy("log.actionType")
      .getRawMany();

    // Entity breakdown
    const entityBreakdown = await auditLogRepository
      .createQueryBuilder("log")
      .select("log.targetEntity", "targetEntity")
      .addSelect("COUNT(*)", "count")
      .where(dateFilter)
      .groupBy("log.targetEntity")
      .getRawMany();

    // Top actors
    const topActors = await auditLogRepository
      .createQueryBuilder("log")
      .select("log.actorName", "actorName")
      .addSelect("log.actorRole", "actorRole")
      .addSelect("COUNT(*)", "count")
      .where(dateFilter)
      .andWhere("log.actorName IS NOT NULL")
      .groupBy("log.actorName")
      .addGroupBy("log.actorRole")
      .orderBy("count", "DESC")
      .limit(10)
      .getRawMany();

    // Recent activity (last 24 hours by hour)
    const recentActivity = await auditLogRepository
      .createQueryBuilder("log")
      .select("DATE_TRUNC('hour', log.createdAt)", "hour")
      .addSelect("COUNT(*)", "count")
      .where("log.createdAt >= NOW() - INTERVAL '24 hours'")
      .groupBy("hour")
      .orderBy("hour", "ASC")
      .getRawMany();

    res.json({
      success: true,
      data: {
        totalLogs,
        successCount,
        failureCount,
        successRate: totalLogs > 0 ? ((successCount / totalLogs) * 100).toFixed(2) : 0,
        averageExecutionDuration: parseFloat(avgDuration?.avg || 0).toFixed(2),
        actionBreakdown,
        entityBreakdown,
        topActors,
        recentActivity,
      },
    });
  } catch (error: any) {
    console.error("Get audit stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit statistics",
    });
  }
};

// Export audit logs to CSV (Admin only)
export const exportAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, actionType, targetEntity } = req.query;

    const queryBuilder = auditLogRepository
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.actor", "actor");

    if (actionType) {
      queryBuilder.andWhere("log.actionType = :actionType", { actionType });
    }

    if (targetEntity) {
      queryBuilder.andWhere("log.targetEntity = :targetEntity", { targetEntity });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere("log.createdAt BETWEEN :startDate AND :endDate", {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
      });
    }

    queryBuilder.orderBy("log.createdAt", "DESC");

    const logs = await queryBuilder.getMany();

    // Build CSV
    const csvHeaders = [
      "Timestamp",
      "Action",
      "Actor",
      "Role",
      "Target Entity",
      "Target Name",
      "IP Address",
      "Duration (ms)",
      "Status Code",
      "Success",
      "Description",
    ];

    const csvRows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.actionType,
      log.actorName || "System",
      log.actorRole || "N/A",
      log.targetEntity,
      log.targetName || "N/A",
      log.ipAddress || "N/A",
      log.executionDuration?.toString() || "N/A",
      log.statusCode?.toString() || "N/A",
      log.isSuccess ? "Yes" : "No",
      log.actionDescription || "N/A",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) =>
        row.map((cell) => `"${cell?.toString().replace(/"/g, '""') || ""}"`).join(",")
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-logs-${new Date().toISOString()}.csv`
    );
    res.send(csvContent);
  } catch (error: any) {
    console.error("Export audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
    });
  }
};

// Delete old audit logs (Admin only - for maintenance)
export const deleteOldAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { days = "90" } = req.query;
    const daysNum = parseInt(days as string) || 90;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const result = await auditLogRepository
      .createQueryBuilder()
      .delete()
      .where("createdAt < :cutoffDate", { cutoffDate })
      .execute();

    res.json({
      success: true,
      message: `Deleted ${result.affected} audit logs older than ${daysNum} days`,
      deletedCount: result.affected,
    });
  } catch (error: any) {
    console.error("Delete old audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete old audit logs",
    });
  }
};
