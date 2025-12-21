import logger from '#src/config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#src/config/database.js';
import { users } from '#src/models/user.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error(`Error hashing password: ${error}`);
    throw new Error('Error hashing password');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error(`Error comparing password: ${error}`);
    throw new Error('Error comparing password');
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error('User with email already exists');
    }

    const hashedPassword = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    logger.info(`User created successfully: ${email}`);

    return newUser;
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    throw new Error('Error creating user');
  }
};

export const authenticateUser = async (email, password) => {
  try {
    const [eixistingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!eixistingUser) {
      throw new Error('User not found');
    }

    const isPasswordValid = await comparePassword(
      password,
      eixistingUser.password
    );

    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    logger.info(`User authenticated successfully: ${email}`);

    return {
      id: eixistingUser.id,
      name: eixistingUser.name,
      email: eixistingUser.email,
      role: eixistingUser.role,
    };
  } catch (e) {
    logger.error(`Error authenticating user: ${e}`);
    throw e;
  }
};
