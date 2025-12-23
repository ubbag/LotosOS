import { z } from 'zod';

export const createGabinetSchema = z.object({
  numer: z.string().min(1, 'Room number is required').trim(),
  nazwa: z.string().min(1, 'Room name is required').trim(),
  notatki: z.string().optional(),
});

export const updateGabinetSchema = z.object({
  numer: z.string().min(1).trim().optional(),
  nazwa: z.string().min(1).trim().optional(),
  notatki: z.string().optional(),
  aktywny: z.boolean().optional(),
});

export type CreateGabinetRequest = z.infer<typeof createGabinetSchema>;
export type UpdateGabinetRequest = z.infer<typeof updateGabinetSchema>;
