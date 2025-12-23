import { z } from 'zod';

// Phone validation: exactly 9 digits
const phoneRegex = /^\d{9}$/;

const normalizePhone = (phone: string): string => {
  // Remove all whitespace, dashes, parentheses, and plus signs
  const cleaned = phone.replace(/[\s\-()+ ]/g, '');

  // If it starts with 48, remove it
  if (cleaned.startsWith('48') && cleaned.length === 11) {
    return cleaned.slice(2);
  }

  // If it starts with 0, remove it
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned.slice(1);
  }

  // Should be exactly 9 digits now
  if (/^\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  throw new Error('Telefon musi składać się z dokładnie 9 cyfr');
};

/**
 * Send SMS Schema - accepts either klientId OR telefon
 */
export const wyslijSMSSchema = z.object({
  klientId: z.string().optional(),
  telefon: z
    .string()
    .transform((val) => normalizePhone(val))
    .refine((val) => phoneRegex.test(val), 'Telefon musi mieć dokładnie 9 cyfr')
    .optional(),
  tresc: z.string().min(1, 'Treść wiadomości jest wymagana').max(160, 'Wiadomość zbyt długa (max 160 znaków)'),
  typ: z.enum(['POTWIERDZENIE', 'PRZYPOMNIENIE', 'PAKIET', 'MARKETING', 'CUSTOM']).optional(),
  rezerwacjaId: z.string().optional(),
}).refine(
  (data) => data.klientId || data.telefon,
  {
    message: 'Wymagane jest podanie klientId lub telefonu',
    path: ['klientId'],
  }
);

/**
 * SMS Logs Query Schema
 */
export const smsLogiQuerySchema = z.object({
  klientId: z.string().optional(),
  rezerwacjaId: z.string().optional(),
  typ: z.enum(['PRZYPOMNIENIE', 'POTWIERDZENIE', 'PAKIET', 'MARKETING']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Type exports
 */
export type WyslijSMSRequest = z.infer<typeof wyslijSMSSchema>;
export type SmsLogiQuery = z.infer<typeof smsLogiQuerySchema>;
