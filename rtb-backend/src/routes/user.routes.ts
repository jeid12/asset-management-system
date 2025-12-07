import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { 
  getUsers, 
  getUserById,
  createUser,
  bulkCreateUsers,
  updateUserRole, 
  deleteUser,
  getUserStats 
} from '../controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, username, or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [school, admin, technician, rtb-staff]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, requireAdmin, getUsers);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     byRole:
 *                       type: object
 *                       properties:
 *                         admin:
 *                           type: integer
 *                           example: 5
 *                         school:
 *                           type: integer
 *                           example: 120
 *                         technician:
 *                           type: integer
 *                           example: 20
 *                         rtb-staff:
 *                           type: integer
 *                           example: 5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticate, requireAdmin, getUserStats);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePass123
 *               phoneNumber:
 *                 type: string
 *                 example: +250788123456
 *               role:
 *                 type: string
 *                 enum: [school, admin, technician, rtb-staff]
 *                 example: school
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: Male
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username or email already exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, requireAdmin, createUser);

/**
 * @swagger
 * /users/bulk:
 *   post:
 *     summary: Bulk create users (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - fullName
 *                     - username
 *                     - email
 *                     - password
 *                     - role
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     password:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [school, admin, technician, rtb-staff]
 *                     gender:
 *                       type: string
 *                       enum: [Male, Female, Other]
 *     responses:
 *       201:
 *         description: Bulk import completed
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/bulk', authenticate, requireAdmin, bulkCreateUsers);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId', authenticate, requireAdmin, getUserById);

/**
 * @swagger
 * /users/{userId}/role:
 *   patch:
 *     summary: Update user role (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [school, admin, technician, rtb-staff]
 *                 example: technician
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or cannot change own role
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:userId/role', authenticate, requireAdmin, updateUserRole);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin - User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied or cannot delete own account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:userId', authenticate, requireAdmin, deleteUser);

export default router;
