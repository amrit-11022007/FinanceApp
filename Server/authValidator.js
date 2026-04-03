import {z} from 'zod';

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name must be between 1 and 100 characters"),
    email: z.string().email("Invalid email address").max(100, "Email must be between 1 and 100 characters"),
    password: z.string().min(6, "Password must be at least 6 characters long").max(72)
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email address").max(100, "Email must be between 1 and 100 characters"),
    password: z.string().min(6, "Password must be at least 6 characters long").max(72)
});