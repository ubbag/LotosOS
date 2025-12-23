import { z } from 'zod';
import Decimal from 'decimal.js';

export const createWariantSchema = z.object({
  czasMinut: z.number().int().positive('Duration must be positive'),
  cenaRegularna: z
    .string()
    .or(z.number())
    .transform((val) => new Decimal(val))
    .or(z.instanceof(Decimal)),
  cenaPromocyjna: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => (val ? new Decimal(val) : undefined))
    .or(z.instanceof(Decimal).optional()),
});

export const createUslugaSchema = z.object({
  nazwa: z.string().min(1, 'Service name is required').trim(),
  kategoriaId: z.string().optional(),
  opis: z.string().optional(),
  warianty: z.array(createWariantSchema).min(1, 'At least one variant is required'),
});

export const updateUslugaSchema = z.object({
  nazwa: z.string().min(1).trim().optional(),
  kategoriaId: z.string().optional(),
  opis: z.string().optional(),
  aktywna: z.boolean().optional(),
  kolejnosc: z.number().int().optional(),
});

export const updateWariantSchema = createWariantSchema.partial();

export const createDoplataSchema = z.object({
  nazwa: z.string().min(1, 'Add-on name is required').trim(),
  cena: z
    .string()
    .or(z.number())
    .transform((val) => new Decimal(val))
    .or(z.instanceof(Decimal)),
});

export const updateDoplataSchema = z.object({
  nazwa: z.string().min(1).trim().optional(),
  cena: z
    .string()
    .or(z.number())
    .transform((val) => new Decimal(val))
    .or(z.instanceof(Decimal))
    .optional(),
  aktywna: z.boolean().optional(),
});

export type CreateWariantRequest = z.infer<typeof createWariantSchema>;
export type CreateUslugaRequest = z.infer<typeof createUslugaSchema>;
export type UpdateUslugaRequest = z.infer<typeof updateUslugaSchema>;
export type UpdateWariantRequest = z.infer<typeof updateWariantSchema>;
export type CreateDoplataRequest = z.infer<typeof createDoplataSchema>;
export type UpdateDoplataRequest = z.infer<typeof updateDoplataSchema>;
