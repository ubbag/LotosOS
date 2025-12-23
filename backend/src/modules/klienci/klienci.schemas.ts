import { z } from 'zod';

// Phone validation: exactly 9 digits
const phoneRegex = /^\d{9}$/;

// Email validation: must have @domena with extension
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const normalizePhone = (phone: string): string => {
  // Remove all whitespace, dashes, parentheses, and plus signs
  const cleaned = phone.replace(/[\s\-()+ ]/g, '');

  // If it starts with 48, remove it (country code)
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

export const createKlientSchema = z.object({
  imie: z.string().min(1, 'Imię jest wymagane').trim(),
  nazwisko: z.string().min(1, 'Nazwisko jest wymagane').trim(),
  telefon: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return '';
      return normalizePhone(val);
    })
    .refine((val) => !val || phoneRegex.test(val), 'Telefon musi mieć dokładnie 9 cyfr')
    .or(z.literal('')),
  email: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return emailRegex.test(val);
    }, 'Email niepoprawny - musi zawierać @domena')
    .or(z.literal('')),
  zrodlo: z.string().optional(),
});

export const updateKlientSchema = createKlientSchema.partial();

export const createNotatkaSchema = z.object({
  typ: z.enum(['MEDYCZNA', 'WAZNA', 'INFORMACJA']),
  tresc: z.string().min(1, 'Content is required').trim(),
  pokazujPrzyRezerwacji: z.boolean().default(false),
});

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Search query must be at least 2 characters'),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  filter: z.enum(['ALL', 'Z_PAKIETEM', 'BEZ_PAKIETU']).optional().default('ALL'),
});

export type CreateKlientRequest = z.infer<typeof createKlientSchema>;
export type UpdateKlientRequest = z.infer<typeof updateKlientSchema>;
export type CreateNotatkaRequest = z.infer<typeof createNotatkaSchema>;
export type SearchQueryRequest = z.infer<typeof searchQuerySchema>;
export type ListQueryRequest = z.infer<typeof listQuerySchema>;
