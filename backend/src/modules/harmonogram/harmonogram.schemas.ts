import { z } from 'zod';

// Create schedule schema
export const createGrafikSchema = z.object({
  masazystaId: z.string().min(1, 'Therapist ID is required'),
  data: z.string().datetime('Invalid date format'),
  godzinaOd: z.string().datetime('Invalid datetime format'),
  godzinaDo: z.string().datetime('Invalid datetime format'),
  status: z.enum(['PRACUJE', 'WOLNE', 'URLOP', 'CHOROBA'] as const).default('PRACUJE'),
});

// Update schedule schema (partial)
export const updateGrafikSchema = z.object({
  masazystaId: z.string().min(1, 'Therapist ID is required').optional(),
  data: z.string().datetime('Invalid date format').optional(),
  godzinaOd: z.string().datetime('Invalid datetime format').optional(),
  godzinaDo: z.string().datetime('Invalid datetime format').optional(),
  status: z.enum(['PRACUJE', 'WOLNE', 'URLOP', 'CHOROBA'] as const).optional(),
});

// List query schema
export const listGrafikQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  masazystaId: z.string().optional(),
  data: z.string().datetime().optional(),
  dataOd: z.string().datetime().optional(),
  dataDo: z.string().datetime().optional(),
  status: z.enum(['PRACUJE', 'WOLNE', 'URLOP', 'CHOROBA'] as const).optional(),
});

// Bulk create schema
export const bulkCreateGrafikSchema = z.object({
  schedules: z.array(createGrafikSchema).min(1, 'At least one schedule is required'),
});

// Get therapist schedule query
export const getTherapistScheduleQuerySchema = z.object({
  dataOd: z.string().datetime('Invalid date format'),
  dataDo: z.string().datetime('Invalid date format'),
});

// Types
export type CreateGrafikRequest = z.infer<typeof createGrafikSchema>;
export type UpdateGrafikRequest = z.infer<typeof updateGrafikSchema>;
export type ListGrafikQuery = z.infer<typeof listGrafikQuerySchema>;
export type BulkCreateGrafikRequest = z.infer<typeof bulkCreateGrafikSchema>;
export type GetTherapistScheduleQuery = z.infer<typeof getTherapistScheduleQuerySchema>;
