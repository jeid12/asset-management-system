// src/middlewares/audit.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../data-source";
import { AuditLog, ActionType, TargetEntity } from "../entities/AuditLog";
import { AuthRequest } from "./auth.middleware";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

/**
 * Extract client IP address from request
 * Handles various proxy headers and direct connections
 */
export const getClientIp = (req: Request): string => {
  const xForwardedFor = req.headers["x-forwarded-for"];
  
  if (xForwardedFor) {
    const ips = (xForwardedFor as string).split(",");
    return ips[0].trim();
  }
  
  return (
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
};

/**
 * Audit logging middleware
 * Automatically captures request metadata and calculates execution duration
 */
export const auditMiddleware = (
  actionType: ActionType,
  targetEntity: TargetEntity,
  options?: {
    getTargetId?: (req: AuthRequest) => string | undefined;
    getTargetName?: (req: AuthRequest) => string | undefined;
    getDescription?: (req: AuthRequest) => string | undefined;
    captureRequestBody?: boolean;
    captureResponseBody?: boolean;
  }
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "unknown";
    const httpMethod = req.method;
    const endpoint = req.originalUrl || req.url;

    // Store original send function
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any;

    // Override send to capture response
    res.send = function (data: any) {
      responseBody = data;
      return originalSend.call(this, data);
    };

    // Override json to capture response
    res.json = function (data: any) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    // Continue to next middleware
    res.on("finish", async () => {
      try {
        const executionDuration = Date.now() - startTime;
        const statusCode = res.statusCode;
        const isSuccess = statusCode >= 200 && statusCode < 400;

        const auditLog = auditLogRepository.create({
          actorId: req.user?.id,
          actorName: (req.user as any)?.fullName,
          actorRole: (req.user as any)?.role,
          actionType,
          actionDescription: options?.getDescription
            ? options.getDescription(req)
            : `${actionType} ${targetEntity}`,
          targetEntity,
          targetId: options?.getTargetId ? options.getTargetId(req) : undefined,
          targetName: options?.getTargetName ? options.getTargetName(req) : undefined,
          ipAddress,
          userAgent,
          httpMethod,
          endpoint,
          executionDuration,
          statusCode,
          isSuccess,
          metadata: {
            requestBody: options?.captureRequestBody ? req.body : undefined,
            responseBody: options?.captureResponseBody ? responseBody : undefined,
            query: req.query,
            params: req.params,
          },
        });

        await auditLogRepository.save(auditLog);
      } catch (error) {
        console.error("Audit log error:", error);
        // Don't throw error to avoid breaking the request
      }
    });

    next();
  };
};

/**
 * Create audit log entry manually
 * Useful for custom audit points where middleware isn't suitable
 */
export const createAuditLog = async (data: {
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  actionType: ActionType;
  actionDescription?: string;
  targetEntity: TargetEntity;
  targetId?: string;
  targetName?: string;
  changes?: {
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changedFields?: string[];
  };
  ipAddress?: string;
  userAgent?: string;
  httpMethod?: string;
  endpoint?: string;
  executionDuration?: number;
  statusCode?: number;
  isSuccess?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): Promise<AuditLog> => {
  const auditLog = auditLogRepository.create({
    ...data,
    isSuccess: data.isSuccess ?? true,
  });

  return await auditLogRepository.save(auditLog);
};

/**
 * Helper to track changes between old and new values
 */
export const trackChanges = (
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  fieldsToTrack?: string[]
): {
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  changedFields: string[];
} => {
  const changes = {
    oldValues: {} as Record<string, any>,
    newValues: {} as Record<string, any>,
    changedFields: [] as string[],
  };

  const keysToCheck = fieldsToTrack || Object.keys(newValues);

  for (const key of keysToCheck) {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changes.oldValues[key] = oldValues[key];
      changes.newValues[key] = newValues[key];
      changes.changedFields.push(key);
    }
  }

  return changes;
};
