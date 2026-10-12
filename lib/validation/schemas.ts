import { z } from "zod";

export const searchBodySchema = z.object({
  q: z.string().min(2).max(200),
});

export const alertBodySchema = z.object({
  productId: z.string().min(1).max(120),
  targetPrice: z.number().positive().max(10_000_000),
});

export const assistantBodySchema = z.object({
  message: z.string().min(1).max(2000),
  searchId: z.string().optional(),
  productId: z.string().optional(),
});

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
});
