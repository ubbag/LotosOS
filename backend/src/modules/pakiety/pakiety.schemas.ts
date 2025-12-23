import { z } from 'zod';

/**
 * Package Definition Schema
 */
export const createDefinicjaSchema = z.object({
  nazwa: z.string().min(1, 'Package name is required'),
  liczbaGodzin: z.number().int().positive('Number of hours must be positive'),
  cena: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (Math.round(num * 100) / 100).toFixed(2);
  }),
  waznoscDni: z.number().int().positive('Validity period must be positive'),
});

export const updateDefinicjaSchema = z.object({
  nazwa: z.string().optional(),
  liczbaGodzin: z.number().int().positive().optional(),
  cena: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return (Math.round(num * 100) / 100).toFixed(2);
    })
    .optional(),
  waznoscDni: z.number().int().positive().optional(),
});

/**
 * Package Sale Schema
 */
export const sprzedajPakietSchema = z.object({
  klientId: z.string().min(1, 'Client ID is required'),
  pakietDefinicjaId: z.string().min(1, 'Package definition ID is required'),
  metoda: z.enum(['GOTOWKA', 'KARTA', 'PRZELEW']),
});

/**
 * Package Query Schemas
 */
export const findByKlientQuerySchema = z.object({
  klientId: z.string().min(1, 'Client ID is required'),
  tylkoAktywne: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Type exports
 */
export type CreateDefinicjaRequest = z.infer<typeof createDefinicjaSchema>;
export type UpdateDefinicjaRequest = z.infer<typeof updateDefinicjaSchema>;
export type SprzedajPakietRequest = z.infer<typeof sprzedajPakietSchema>;
export type FindByKlientQueryRequest = z.infer<typeof findByKlientQuerySchema>;
export type HistoryQueryRequest = z.infer<typeof historyQuerySchema>;
