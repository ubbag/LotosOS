import { z } from 'zod';

// Phone validation: exactly 9 digits
const phoneRegex = /^\d{9}$/;

// Email validation: must have @domena.pl or @domena.com
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(pl|com)$/;

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
 * Klient data for online reservation
 */
const klientDataSchema = z.object({
  imie: z.string().min(2, 'Imię wymagane (min. 2 znaki)').max(50),
  nazwisko: z.string().min(2, 'Nazwisko wymagane (min. 2 znaki)').max(50),
  telefon: z
    .string()
    .min(1, 'Telefon jest wymagany')
    .transform((val) => normalizePhone(val))
    .refine((val) => phoneRegex.test(val), 'Telefon musi mieć dokładnie 9 cyfr'),
  email: z.string().regex(emailRegex, 'Email musi mieć format: nazwa@domena.pl lub nazwa@domena.com'),
});

/**
 * Online Reservation Schema
 */
export const createRezerwacjaOnlineSchema = z.object({
  klient: klientDataSchema,
  wariantId: z.string().min(1, 'Service variant required'),
  data: z.string().datetime('Invalid date format'),
  godzina: z.string().datetime('Invalid time format'),
  masazystaId: z.string().optional(),
  doplaty: z.array(z.string()).default([]),
  platnoscOnline: z.boolean().default(false),
  honeypot: z.string().optional().refine((val) => !val, {
    message: 'Bot detected',
  }),
});

/**
 * Obdarowany (recipient) data for vouchers
 */
const obdarowanySchema = z.object({
  imie: z.string().min(1, 'Imię obdarowanego wymagane'),
  email: z.string().regex(emailRegex, 'Email musi mieć format: nazwa@domena.pl lub nazwa@domena.com'),
});

/**
 * Online Voucher Schema
 */
export const createVoucherOnlineSchema = z.object({
  typ: z.enum(['KWOTOWY', 'USLUGOWY']),
  wartosc: z.union([z.string(), z.number()]).optional(),
  uslugaId: z.string().optional(),
  kupujacy: klientDataSchema,
  obdarowany: obdarowanySchema,
  wiadomosc: z.string().max(500).optional(),
  platnoscOnline: z.boolean().default(true),
  honeypot: z.string().optional().refine((val) => !val, {
    message: 'Bot detected',
  }),
}).refine(
  (data) => {
    if (data.typ === 'KWOTOWY') {
      return data.wartosc !== undefined && data.wartosc !== null && data.wartosc !== '';
    }
    if (data.typ === 'USLUGOWY') {
      return data.uslugaId !== undefined;
    }
    return false;
  },
  {
    message: 'Kwotowy requires wartosc, Uslugowy requires uslugaId',
    path: ['typ'],
  }
);

/**
 * Payment Webhook Schema
 */
export const paymentWebhookSchema = z.object({
  sessionId: z.string(),
  status: z.enum(['success', 'failed', 'pending']),
  payload: z.string(), // JSON stringified payload
  signature: z.string(),
});

/**
 * Type exports
 */
export type CreateRezerwacjaOnlineRequest = z.infer<typeof createRezerwacjaOnlineSchema>;
export type CreateVoucherOnlineRequest = z.infer<typeof createVoucherOnlineSchema>;
export type PaymentWebhookRequest = z.infer<typeof paymentWebhookSchema>;
