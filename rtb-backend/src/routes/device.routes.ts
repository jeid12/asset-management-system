import { Router } from "express";
import {
  getDevices,
  getDeviceById,
  createDevice,
  bulkCreateDevices,
  bulkAssignDevices,
  updateDevice,
  deleteDevice,
  getDeviceStats
} from "../controllers/device.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/role.middleware";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         serialNumber:
 *           type: string
 *         category:
 *           type: string
 *           enum: [Laptop, Desktop, Tablet, Projector, Others]
 *         brand:
 *           type: string
 *         model:
 *           type: string
 *         schoolCode:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [Available, Assigned, Maintenance, Written Off]
 *         specifications:
 *           type: string
 *           nullable: true
 *         condition:
 *           type: string
 *           enum: [New, Good, Fair, Faulty]
 *         assetTag:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /devices/stats:
 *   get:
 *     summary: Get device statistics
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Device statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     byStatus:
 *                       type: object
 *                     byCategory:
 *                       type: object
 *                     byCondition:
 *                       type: object
 */
router.get("/stats", authenticate, getDeviceStats);

/**
 * @swagger
 * /devices:
 *   get:
 *     summary: Get all devices with pagination and filters
 *     tags: [Devices]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by serial number, brand, model, or asset tag
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: schoolCode
 *         schema:
 *           type: string
 *         description: Filter by school code
 *     responses:
 *       200:
 *         description: List of devices with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Device'
 *                 pagination:
 *                   type: object
 */
router.get("/", authenticate, getDevices);

/**
 * @swagger
 * /devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device details
 *       404:
 *         description: Device not found
 */
router.get("/:id", authenticate, getDeviceById);

/**
 * @swagger
 * /devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *               - category
 *               - brand
 *               - model
 *               - status
 *               - condition
 *             properties:
 *               serialNumber:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Laptop, Desktop, Tablet, Projector, Others]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               schoolCode:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [Available, Assigned, Maintenance, Written Off]
 *               specifications:
 *                 type: string
 *               condition:
 *                 type: string
 *                 enum: [New, Good, Fair, Faulty]
 *               assetTag:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Validation error
 */
router.post("/", authenticate, requireAdmin, createDevice);

/**
 * @swagger
 * /devices/bulk:
 *   post:
 *     summary: Bulk create devices
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               devices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     serialNumber:
 *                       type: string
 *                     category:
 *                       type: string
 *                     brand:
 *                       type: string
 *                     model:
 *                       type: string
 *                     schoolCode:
 *                       type: string
 *                     status:
 *                       type: string
 *                     specifications:
 *                       type: string
 *                     condition:
 *                       type: string
 *                     assetTag:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk create completed
 */
router.post("/bulk", authenticate, requireAdmin, bulkCreateDevices);

/**
 * @swagger
 * /devices/bulk-assign:
 *   post:
 *     summary: Bulk assign devices to a school
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumbers
 *               - schoolCode
 *             properties:
 *               serialNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               schoolCode:
 *                 type: string
 *               assetTagPrefix:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk assign completed
 */
router.post("/bulk-assign", authenticate, requireAdmin, bulkAssignDevices);

/**
 * @swagger
 * /devices/{id}:
 *   put:
 *     summary: Update a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serialNumber:
 *                 type: string
 *               category:
 *                 type: string
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               schoolCode:
 *                 type: string
 *               status:
 *                 type: string
 *               specifications:
 *                 type: string
 *               condition:
 *                 type: string
 *               assetTag:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put("/:id", authenticate, requireAdmin, updateDevice);

/**
 * @swagger
 * /devices/{id}:
 *   delete:
 *     summary: Delete a device
 *     tags: [Devices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete("/:id", authenticate, requireAdmin, deleteDevice);

export default router;
