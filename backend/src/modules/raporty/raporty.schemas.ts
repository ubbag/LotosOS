import { z } from 'zod';

/**
 * Daily Revenue Query
 */
export const utargDziennyQuerySchema = z.object({
  data: z.string().datetime('Invalid date format'),
});

/**
 * Monthly Revenue Query
 */
export const utargMiesiecznyQuerySchema = z.object({
  rok: z.coerce.number().int().min(2000).max(2100),
  miesiac: z.coerce.number().int().min(1).max(12),
});

/**
 * Yearly Revenue Query
 */
export const utargRocznyQuerySchema = z.object({
  rok: z.coerce.number().int().min(2000).max(2100),
});

/**
 * Therapist Settlement Query
 */
export const rozliczenieQuerySchema = z.object({
  odDaty: z.string().datetime('Invalid start date format'),
  doDaty: z.string().datetime('Invalid end date format'),
});

/**
 * Statistics Period Query
 */
export const statystykiPeriodSchema = z.object({
  okres: z.enum(['tydzien', 'miesiac', 'kwartал', 'rok']).optional().default('miesiac'),
});

/**
 * Occupancy Query
 */
export const oblozenieQuerySchema = z.object({
  odDaty: z.string().datetime('Invalid start date format'),
  doDaty: z.string().datetime('Invalid end date format'),
});

/**
 * Closures Query
 */
export const zamknienciaQuerySchema = z.object({
  odDaty: z.string().datetime('Invalid start date format'),
  doDaty: z.string().datetime('Invalid end date format'),
});

/**
 * Closure Day Summary Query
 */
export const podsumowanieDniaSchema = z.object({
  data: z.string().datetime('Invalid date format'),
});

/**
 * Close Day Schema
 */
export const zamknijDzienSchema = z.object({
  data: z.string().datetime('Invalid date format'),
  gotowkaRzeczywista: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (Math.round(num * 100) / 100).toFixed(2);
  }),
  kartaRzeczywista: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (Math.round(num * 100) / 100).toFixed(2);
  }),
  uwagi: z.string().max(1000).optional(),
});

/**
 * Type exports
 */
export type UtargDziennyQuery = z.infer<typeof utargDziennyQuerySchema>;
export type UtargMiesiecznyQuery = z.infer<typeof utargMiesiecznyQuerySchema>;
export type UtargRocznyQuery = z.infer<typeof utargRocznyQuerySchema>;
export type RozliczenieQuery = z.infer<typeof rozliczenieQuerySchema>;
export type StatystykiPeriod = z.infer<typeof statystykiPeriodSchema>;
export type OblozenieQuery = z.infer<typeof oblozenieQuerySchema>;
export type ZamknienciaQuery = z.infer<typeof zamknienciaQuerySchema>;
export type PodsumowanieDniaQuery = z.infer<typeof podsumowanieDniaSchema>;
export type ZamknijDzienRequest = z.infer<typeof zamknijDzienSchema>;
