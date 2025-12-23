import { z } from 'zod';

// Email validation: must have @domena.pl or @domena.com
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(pl|com)$/;

/**
 * Voucher Creation Schema
 */
export const createVoucherSchema = z.object({
  typ: z.enum(['KWOTOWY', 'USLUGOWY']),
  wartosc: z.union([z.string(), z.number()]).optional(),
  uslugaId: z.string().optional(),
  iloscGodzin: z.union([z.string(), z.number()]).transform((val) => {
    if (val === undefined || val === null || val === '') return undefined;
    return typeof val === 'string' ? parseInt(val, 10) : val;
  }).optional(),
  kupujacyImie: z.string().min(1, 'Imię kupującego jest wymagane'),
  kupujacyEmail: z.string().regex(emailRegex, 'Email musi mieć format: nazwa@domena.pl lub nazwa@domena.com').optional(),
  obdarowanyImie: z.string().optional(),
  obdarowanyEmail: z.string().regex(emailRegex, 'Email musi mieć format: nazwa@domena.pl lub nazwa@domena.com').optional(),
  wiadomosc: z.string().max(500, 'Wiadomość zbyt długa (max 500 znaków)').optional(),
  metoda: z.enum(['GOTOWKA', 'KARTA', 'PRZELEW']),
  zrodlo: z.enum(['RECEPCJA', 'ONLINE']).default('RECEPCJA'),
  dataWaznosci: z.string().optional(),
}).refine(
  (data) => {
    if (data.typ === 'KWOTOWY') {
      return data.wartosc !== undefined && data.wartosc !== null && data.wartosc !== '';
    }
    if (data.typ === 'USLUGOWY') {
      return data.uslugaId !== undefined && data.iloscGodzin !== undefined;
    }
    return false;
  },
  {
    message: 'Kwotowy requires wartosc, Uslugowy requires uslugaId and iloscGodzin',
    path: ['typ'],
  }
);

/**
 * Voucher Realization Schema
 */
export const realizujSchema = z.object({
  rezerwacjaId: z.string().min(1, 'Reservation ID is required'),
  kwota: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return (Math.round(num * 100) / 100).toFixed(2);
  }),
});

/**
 * Voucher Code Check Schema
 */
export const sprawdzKodSchema = z.object({
  kod: z.string().min(1, 'Code is required'),
});

/**
 * Voucher Update Schema (extend validity)
 */
export const przedluzSchema = z.object({
  nowaDataWaznosci: z.string().datetime('Invalid date format'),
});

/**
 * Voucher Filters Schema
 */
export const voucherFiltersSchema = z.object({
  status: z.enum(['AKTYWNY', 'WYKORZYSTANY', 'WYGASLY']).optional(),
  typ: z.enum(['KWOTOWY', 'USLUGOWY']).optional(),
  zrodlo: z.enum(['RECEPCJA', 'ONLINE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Type exports
 */
export type CreateVoucherRequest = z.infer<typeof createVoucherSchema>;
export type RealizujRequest = z.infer<typeof realizujSchema>;
export type SprawdzKodRequest = z.infer<typeof sprawdzKodSchema>;
export type PrzedluzRequest = z.infer<typeof przedluzSchema>;
export type VoucherFiltersRequest = z.infer<typeof voucherFiltersSchema>;
