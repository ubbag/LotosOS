import { z } from 'zod';

// Create reservation schema
export const createRezerwacjaSchema = z.object({
  klientId: z.string().min(1, 'Client ID is required'),
  masazystaId: z.string().min(1, 'Therapist ID is required'),
  gabinetId: z.string().min(1, 'Cabinet ID is required'),
  uslugaId: z.string().min(1, 'Service ID is required'),
  wariantId: z.string().min(1, 'Service variant ID is required'),
  data: z.string().datetime('Invalid date format'),
  godzinaOd: z.string().datetime('Invalid datetime format'),
  godzinaDo: z.string().datetime('Invalid datetime format'),
  cenaCalokowita: z.number().positive('Price must be positive'),
  zrodlo: z.enum(['TELEFON', 'ONLINE', 'WALKIN'] as const),
  platnoscMetoda: z.enum(['GOTOWKA', 'KARTA', 'MIESZANE', 'PRZELEW', 'PAKIET', 'VOUCHER'] as const),
  notatki: z.string().optional(),
  doplaty: z.array(
    z.object({
      doplataId: z.string(),
      cena: z.number().positive(),
    })
  ).optional().default([]),
});

// Update reservation schema (partial)
export const updateRezerwacjaSchema = z.object({
  klientId: z.string().min(1, 'Client ID is required').optional(),
  masazystaId: z.string().min(1, 'Therapist ID is required').optional(),
  gabinetId: z.string().min(1, 'Cabinet ID is required').optional(),
  uslugaId: z.string().min(1, 'Service ID is required').optional(),
  wariantId: z.string().min(1, 'Service variant ID is required').optional(),
  data: z.string().datetime('Invalid date format').optional(),
  godzinaOd: z.string().datetime('Invalid datetime format').optional(),
  godzinaDo: z.string().datetime('Invalid datetime format').optional(),
  cenaCalokowita: z.number().positive('Price must be positive').optional(),
  zrodlo: z.enum(['TELEFON', 'ONLINE', 'WALKIN'] as const).optional(),
  platnoscMetoda: z.enum(['GOTOWKA', 'KARTA', 'PRZELEW', 'PAKIET', 'VOUCHER'] as const).optional(),
  notatki: z.string().optional(),
  doplaty: z.array(
    z.object({
      doplataId: z.string(),
      cena: z.number().positive(),
    })
  ).optional(),
});

// Update reservation status schema
export const updateStatusRezerwacjiSchema = z.object({
  status: z.enum(['NOWA', 'POTWIERDZONA', 'W TRAKCIE', 'ZAKONCZONA', 'ANULOWANA', 'NO_SHOW'] as const),
  notatki: z.string().optional(),
});

// Update payment status schema
export const updatePlatnoscSchema = z.object({
  platnoscStatus: z.enum(['NIEOPLACONA', 'OPLACONA', 'CZESCIOWO_OPLACONA', 'ZWROCONA'] as const),
  platnoscMetoda: z.enum(['GOTOWKA', 'KARTA', 'PRZELEW', 'PAKIET', 'VOUCHER'] as const).optional(),
  notatki: z.string().optional(),
});

// List query schema
export const listRezerwacjiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['NOWA', 'POTWIERDZONA', 'W_TRAKCIE', 'ZAKONCZONA', 'ANULOWANA', 'NO_SHOW'] as const).optional(),
  klientId: z.string().optional(),
  masazystaId: z.string().optional(),
  gabinetId: z.string().optional(),
  dataOd: z.string().datetime().optional(),
  dataDo: z.string().datetime().optional(),
  platnoscStatus: z.enum(['NIEOPLACONA', 'OPLACONA', 'CZESCIOWO_OPLACONA', 'ZWROCONA'] as const).optional(),
});

// Availability check schema
export const checkAvailabilitySchema = z.object({
  masazystaId: z.string().min(1, 'Therapist ID is required'),
  gabinetId: z.string().min(1, 'Cabinet ID is required'),
  godzinaOd: z.string().datetime('Invalid datetime format'),
  godzinaDo: z.string().datetime('Invalid datetime format'),
  excludeRezerwacjaId: z.string().optional(),
});

// Types
export type CreateRezerwacjaRequest = z.infer<typeof createRezerwacjaSchema>;
export type UpdateRezerwacjaRequest = z.infer<typeof updateRezerwacjaSchema>;
export type UpdateStatusRezerwacjiRequest = z.infer<typeof updateStatusRezerwacjiSchema>;
export type UpdatePlatnoscRequest = z.infer<typeof updatePlatnoscSchema>;
export type ListRezerwacjiQuery = z.infer<typeof listRezerwacjiQuerySchema>;
export type CheckAvailabilityRequest = z.infer<typeof checkAvailabilitySchema>;
