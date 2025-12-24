import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must be at most 255 characters long')
    .trim()
    .optional(),
  email: z
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters long')
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(128, 'Password must be at most 128 characters long')
    .optional(),
  role: z.enum(['user', 'admin']).optional(),
});
