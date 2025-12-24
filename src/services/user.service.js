import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from './auth.service.js';

export const getAllUsers = async () => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users);

    logger.info('Retrieved all users');
    return allUsers;
  } catch (error) {
    logger.error(`Error retrieving all users: ${error}`);
    throw new Error('Error retrieving users');
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`Retrieved user by ID: ${id}`);
    return user;
  } catch (error) {
    logger.error(`Error retrieving user by ID: ${error}`);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData = { ...updates };

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Update timestamp
    updateData.updated_at = new Date();

    // Perform update
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User updated successfully: ${id}`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user: ${error}`);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    logger.info(`User deleted successfully: ${id}`);
    return { id, message: 'User deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting user: ${error}`);
    throw error;
  }
};
