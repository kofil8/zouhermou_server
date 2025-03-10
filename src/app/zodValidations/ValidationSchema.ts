import { z } from "zod";

// Base schema for both students and instructors
export const baseUserSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  fcpmToken: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});
