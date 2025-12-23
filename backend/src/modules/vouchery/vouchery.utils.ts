import { prisma } from '../../shared/prisma';

/**
 * Generate unique voucher code
 * Format: LOTOS-XXXX-XXXX (without confusing characters: 0, O, 1, l, I)
 */
export async function generujKod(): Promise<string> {
  // Characters to use: 2-9, A-H, J-N, P-Z (avoid 0, O, 1, l, I)
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

  let isUnique = false;
  let kod = '';

  while (!isUnique) {
    // Generate LOTOS-XXXX-XXXX format
    let part1 = '';
    let part2 = '';

    for (let i = 0; i < 4; i++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length));
      part2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    kod = `LOTOS-${part1}-${part2}`;

    // Check uniqueness
    isUnique = await sprawdzUnikalnosc(kod);
  }

  return kod;
}

/**
 * Check if voucher code is unique
 */
export async function sprawdzUnikalnosc(kod: string): Promise<boolean> {
  const existingVoucher = await prisma.voucher.findUnique({
    where: { kod },
  });

  return !existingVoucher;
}
