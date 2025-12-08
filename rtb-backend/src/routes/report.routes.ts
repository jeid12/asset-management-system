// src/routes/report.routes.ts
import { Router } from "express";
import {
  generateReport,
  exportReportCSV,
  exportReportPDF,
  getAvailableReports,
  getReportColumns,
} from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /api/reports/available:
 *   get:
 *     summary: Get available report types based on user role
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available reports
 *       401:
 *         description: Unauthorized
 */
router.get("/available", authenticate, getAvailableReports);

/**
 * @swagger
 * /api/reports/columns/{reportType}:
 *   get:
 *     summary: Get available columns for a report type
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [devices, applications, users, schools, audit_logs, notifications]
 *     responses:
 *       200:
 *         description: List of available columns
 *       401:
 *         description: Unauthorized
 */
router.get("/columns/:reportType", authenticate, getReportColumns);

/**
 * @swagger
 * /api/reports/generate:
 *   get:
 *     summary: Generate and preview report data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [devices, applications, users, schools, audit_logs, notifications]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Report data with pagination
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get("/generate", authenticate, generateReport);

/**
 * @swagger
 * /api/reports/export/csv:
 *   get:
 *     summary: Export report as CSV
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [devices, applications, users, schools, audit_logs, notifications]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: CSV file download
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get("/export/csv", authenticate, exportReportCSV);

/**
 * @swagger
 * /api/reports/export/pdf:
 *   get:
 *     summary: Export report as PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [devices, applications, users, schools, audit_logs, notifications]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PDF file download
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get("/export/pdf", authenticate, exportReportPDF);

export default router;
