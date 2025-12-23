import { z } from 'zod';

export const createKategoriaSchema = z.object({
  nazwa: z.string().min(1, 'Nazwa jest wymagana'),
  opis: z.string().optional(),
  kolejnosc: z.number().int().min(0).optional(),
});

export const updateKategoriaSchema = z.object({
  nazwa: z.string().min(1).optional(),
  opis: z.string().optional(),
  aktywna: z.boolean().optional(),
  kolejnosc: z.number().int().min(0).optional(),
});

export type CreateKategoriaRequest = z.infer<typeof createKategoriaSchema>;
export type UpdateKategoriaRequest = z.infer<typeof updateKategoriaSchema>;
