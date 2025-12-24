import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import { authenticate, authorize } from '#middleware/auth.middleware.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), getAllUsers);

// Get user by ID (authenticated users only)
router.get('/:id', authenticate, getUserById);

// Update user by ID (authenticated users - can update own info, admins can update any)
router.put('/:id', authenticate, updateUser);

// Delete user by ID (admin only)
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
