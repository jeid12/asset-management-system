import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getSchools,
  getSchoolById,
  createSchool,
  bulkCreateSchools,
  updateSchool,
  deleteSchool,
  getSchoolStats
} from '../controllers/school.controller';

const router = Router();

/**
 * @swagger
 * /schools:
 *   get:
 *     summary: Get all schools with pagination and filtering
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by school name, code, or district
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [TSS, VTC, Other]
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Schools retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getSchools);

/**
 * @swagger
 * /schools/stats:
 *   get:
 *     summary: Get school statistics (Admin/Staff only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, requireRole('admin', 'rtb-staff'), getSchoolStats);

/**
 * @swagger
 * /schools/{schoolId}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: School retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: School not found
 *       500:
 *         description: Server error
 */
router.get('/:schoolId', authenticate, getSchoolById);

/**
 * @swagger
 * /schools:
 *   post:
 *     summary: Create a new school (Admin/Staff only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolCode
 *               - schoolName
 *               - category
 *               - province
 *               - district
 *               - sector
 *             properties:
 *               schoolCode:
 *                 type: string
 *                 example: TSS001
 *               schoolName:
 *                 type: string
 *                 example: Kigali Technical Secondary School
 *               category:
 *                 type: string
 *                 enum: [TSS, VTC, Other]
 *                 example: TSS
 *               province:
 *                 type: string
 *                 example: Kigali City
 *               district:
 *                 type: string
 *                 example: Gasabo
 *               sector:
 *                 type: string
 *                 example: Remera
 *               cell:
 *                 type: string
 *                 example: Rukiri I
 *               village:
 *                 type: string
 *                 example: Amahoro
 *               email:
 *                 type: string
 *                 format: email
 *                 example: info@school.rw
 *               phoneNumber:
 *                 type: string
 *                 example: +250788123456
 *               address:
 *                 type: string
 *                 example: KG 123 St, Kigali
 *               representativeId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 default: Active
 *     responses:
 *       201:
 *         description: School created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       409:
 *         description: School code already exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, requireRole('admin', 'rtb-staff'), createSchool);

/**
 * @swagger
 * /schools/bulk:
 *   post:
 *     summary: Bulk create schools (Admin/Staff only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schools:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - schoolCode
 *                     - schoolName
 *                     - category
 *                     - province
 *                     - district
 *                     - sector
 *                   properties:
 *                     schoolCode:
 *                       type: string
 *                     schoolName:
 *                       type: string
 *                     category:
 *                       type: string
 *                       enum: [TSS, VTC, Other]
 *                     province:
 *                       type: string
 *                     district:
 *                       type: string
 *                     sector:
 *                       type: string
 *                     cell:
 *                       type: string
 *                     village:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     address:
 *                       type: string
 *                     representativeId:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       enum: [Active, Inactive]
 *     responses:
 *       201:
 *         description: Bulk import completed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Server error
 */
router.post('/bulk', authenticate, requireRole('admin', 'rtb-staff'), bulkCreateSchools);

/**
 * @swagger
 * /schools/{schoolId}:
 *   patch:
 *     summary: Update school
 *     description: Admin/Staff can update all fields. School role can only update email, phoneNumber, and address.
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolName:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [TSS, VTC, Other]
 *               province:
 *                 type: string
 *               district:
 *                 type: string
 *               sector:
 *                 type: string
 *               cell:
 *                 type: string
 *               village:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               representativeId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: School updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: School not found
 *       500:
 *         description: Server error
 */
router.patch('/:schoolId', authenticate, updateSchool);

/**
 * @swagger
 * /schools/{schoolId}:
 *   delete:
 *     summary: Delete school (Admin/Staff only)
 *     tags: [Schools]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schoolId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: School deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: School not found
 *       500:
 *         description: Server error
 */
router.delete('/:schoolId', authenticate, requireRole('admin', 'rtb-staff'), deleteSchool);

export default router;
