// src/routes/audit-log.routes.ts
import { Router } from "express";
import {
  getAuditLogs,
  getAuditLogById,
  getAuditLogStats,
  exportAuditLogs,
  deleteOldAuditLogs,
} from "../controllers/audit-log.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireRole(["admin"]));

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get all audit logs with filters (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: targetEntity
 *         schema:
 *           type: string
 *         description: Filter by target entity
 *       - in: query
 *         name: actorId
 *         schema:
 *           type: string
 *         description: Filter by actor ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Start date for date range filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: End date for date range filter
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for actor, description, target, or IP
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 */
router.get("/", getAuditLogs);

/**
 * @swagger
 * /api/audit-logs/stats:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get audit log statistics (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get("/stats", getAuditLogStats);

/**
 * @swagger
 * /api/audit-logs/export:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Export audit logs to CSV (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get("/export", exportAuditLogs);

/**
 * @swagger
 * /api/audit-logs/cleanup:
 *   delete:
 *     tags:
 *       - Audit Logs
 *     summary: Delete old audit logs (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete("/cleanup", deleteOldAuditLogs);

/**
 * @swagger
 * /api/audit-logs/{id}:
 *   get:
 *     tags:
 *       - Audit Logs
 *     summary: Get single audit log details (Admin only)
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", getAuditLogById);

export default router;
