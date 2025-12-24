import logger from '#config/logger.js';
import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/user.service.js';
import { formatValidationErrors } from '#utils/format.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/user.validation.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await getAllUsersService();

    logger.info('Retrieved all users successfully');
    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
    });
  } catch (error) {
    logger.error('Error retrieving all users:', error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(paramValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const user = await getUserByIdService(id);

    logger.info(`Retrieved user by ID: ${id}`);
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (error) {
    logger.error('Error retrieving user by ID:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    // Validate user ID from params
    const paramValidation = userIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(paramValidation.error),
      });
    }

    // Validate update data from body
    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(bodyValidation.error),
      });
    }

    const { id } = paramValidation.data;
    const updates = bodyValidation.data;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required',
      });
    }

    // Check if user is trying to update their own information or is an admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own information',
      });
    }

    // Only admins can change user roles
    if (updates.role && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can change user roles',
      });
    }

    // If non-admin is updating themselves, remove role from updates
    if (req.user.id === id && req.user.role !== 'admin') {
      delete updates.role;
    }

    const updatedUser = await updateUserService(id, updates);

    logger.info(`User updated successfully: ${id}`);
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const paramValidation = userIdSchema.safeParse(req.params);

    if (!paramValidation.success) {
      return res.status(400).json({
        error: 'Validation Failed',
        details: formatValidationErrors(paramValidation.error),
      });
    }

    const { id } = paramValidation.data;

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication is required',
      });
    }

    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only administrators can delete users',
      });
    }

    await deleteUserService(id);

    logger.info(`User deleted successfully: ${id}`);
    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting user:', error);

    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    next(error);
  }
};
