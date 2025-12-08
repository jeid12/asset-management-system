// src/routes/device-application.routes.ts
import { Router } from "express";
import {
  createApplication,
  getAllApplications,
  getMyApplications,
  getApplicationById,
  downloadApplicationLetter,
  reviewApplication,
  updateEligibility,
  assignDevices,
  confirmReceipt,
  cancelApplication,
  deleteApplication,
} from "../controllers/device-application.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { uploadApplicationLetter } from "../middlewares/upload-application.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/applications:
 *   post:
 *     tags:
 *       - Device Applications
 *     summary: Create new device application (School users only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - purpose
 *               - letter
 *             properties:
 *               purpose:
 *                 type: string
 *               justification:
 *                 type: string
 *               requestedLaptops:
 *                 type: integer
 *               requestedDesktops:
 *                 type: integer
 *               requestedTablets:
 *                 type: integer
 *               requestedProjectors:
 *                 type: integer
 *               requestedOthers:
 *                 type: integer
 *               letter:
 *                 type: string
 *                 format: binary
 */
router.post(
  "/",
  requireRole(["school"]),
  uploadApplicationLetter.single("letter"),
  createApplication
);

/**
 * @swagger
 * /api/applications/my:
 *   get:
 *     tags:
 *       - Device Applications
 *     summary: Get my applications (School users)
 */
router.get("/my", requireRole(["school"]), getMyApplications);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     tags:
 *       - Device Applications
 *     summary: Get all applications (Admin/Staff only)
 */
router.get("/", requireRole(["admin", "rtb-staff"]), getAllApplications);

/**
 * @swagger
 * /api/applications/{id}/letter:
 *   get:
 *     tags:
 *       - Device Applications
 *     summary: Download application letter (PDF)
 */
router.get("/:id/letter", downloadApplicationLetter);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     tags:
 *       - Device Applications
 *     summary: Get application details by ID
 */
router.get("/:id", getApplicationById);

/**
 * @swagger
 * /api/applications/{id}/review:
 *   put:
 *     tags:
 *       - Device Applications
 *     summary: Review application (Admin/Staff only)
 */
router.put("/:id/review", requireRole(["admin", "rtb-staff"]), reviewApplication);

/**
 * @swagger
 * /api/applications/{id}/eligibility:
 *   put:
 *     tags:
 *       - Device Applications
 *     summary: Update eligibility status (Admin/Staff only)
 */
router.put("/:id/eligibility", requireRole(["admin", "rtb-staff"]), updateEligibility);

/**
 * @swagger
 * /api/applications/{id}/assign:
 *   post:
 *     tags:
 *       - Device Applications
 *     summary: Assign devices to application (Admin/Staff only)
 */
router.post("/:id/assign", requireRole(["admin", "rtb-staff"]), assignDevices);

/**
 * @swagger
 * /api/applications/{id}/confirm:
 *   post:
 *     tags:
 *       - Device Applications
 *     summary: Confirm receipt of devices (School users only)
 */
router.post("/:id/confirm", requireRole(["school"]), confirmReceipt);

/**
 * @swagger
 * /api/applications/{id}/cancel:
 *   put:
 *     tags:
 *       - Device Applications
 *     summary: Cancel application (School users only - pending applications)
 */
router.put("/:id/cancel", requireRole(["school"]), cancelApplication);

/**
 * @swagger
 * /api/applications/{id}:
 *   delete:
 *     tags:
 *       - Device Applications
 *     summary: Delete application (School users only - cancelled or rejected applications)
 */
router.delete("/:id", requireRole(["school"]), deleteApplication);

export default router;
