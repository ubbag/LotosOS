import { z } from 'zod';

/**
 * Schema for creating a new therapist
 */
export const createMasazystaSchema = z.object({
  imie: z.string().min(1, 'First name is required').trim(),
  nazwisko: z.string().min(1, 'Last name is required').trim(),
  specjalizacje: z.array(z.string()).default([]),
  jezyki: z.array(z.string()).default([]),
  zdjecieUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
  kolejnosc: z.number().int().min(0).default(0),
});

/**
 * Schema for updating an existing therapist
 */
export const updateMasazystaSchema = createMasazystaSchema.partial();

/**
 * Schema for listing therapists with pagination and filters
 */
export const listMasazysciQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  aktywny: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
});

/**
 * Schema for getting therapist schedule in a date range
 */
export const getScheduleQuerySchema = z.object({
  dataOd: z
    .string()
    .min(1, 'Start date is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  dataDo: z
    .string()
    .min(1, 'End date is required')
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
});

/**
 * Schema for getting therapist reservations with filters
 */
export const getReservationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['NOWA', 'POTWIERDZONA', 'W TRAKCIE', 'ZAKONCZONA', 'ANULOWANA', 'NO_SHOW'])
    .optional(),
  dataOd: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid start date format'
    ),
  dataDo: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid end date format'
    ),
});

// Type exports
export type CreateMasazystaRequest = z.infer<typeof createMasazystaSchema>;
export type UpdateMasazystaRequest = z.infer<typeof updateMasazystaSchema>;
export type ListMasazysciQueryRequest = z.infer<typeof listMasazysciQuerySchema>;
export type GetScheduleQueryRequest = z.infer<typeof getScheduleQuerySchema>;
export type GetReservationsQueryRequest = z.infer<typeof getReservationsQuerySchema>;
