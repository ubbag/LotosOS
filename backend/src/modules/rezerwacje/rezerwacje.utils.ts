import { prisma } from '../../shared/prisma';

/**
 * Generate unique reservation number
 * Format: R-YYYY-XXXXXXXX (e.g., R-2024-A1B2C3D4)
 * Uses timestamp + random to avoid race conditions
 */
export async function generujNumerRezerwacji(): Promise<string> {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString(36).toUpperCase(); // Convert to base36
  const random = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4 random chars

  return `R-${year}-${timestamp}${random}`;
}

/**
 * Calculate total price for reservation
 */
export async function obliczCene(
  wariantId: string,
  doplatyIds?: string[]
): Promise<{ cenaUslugu: number; cenaDoplit: number; cenaCalokowita: number }> {
  const wariant = await prisma.wariantUslugi.findUnique({
    where: { id: wariantId },
  });

  if (!wariant) {
    throw new Error('Variant not found');
  }

  // Use promo price if available, otherwise regular price
  const cenaUslugu = wariant.cenaPromocyjna || wariant.cenaRegularna;

  // Calculate add-ons price
  let cenaDoplit = 0;
  if (doplatyIds && doplatyIds.length > 0) {
    const doplaty = await prisma.doplata.findMany({
      where: { id: { in: doplatyIds } },
    });

    cenaDoplit = doplaty.reduce((sum, d) => sum + d.cena, 0);
  }

  const cenaCalokowita = cenaUslugu + cenaDoplit;

  return {
    cenaUslugu,
    cenaDoplit,
    cenaCalokowita,
  };
}

/**
 * Check if two time slots overlap
 */
export function sprawdzNakladanieSie(
  slot1: { godzinaOd: Date; godzinaDo: Date },
  slot2: { godzinaOd: Date; godzinaDo: Date }
): boolean {
  const start1 = new Date(slot1.godzinaOd).getTime();
  const end1 = new Date(slot1.godzinaDo).getTime();
  const start2 = new Date(slot2.godzinaOd).getTime();
  const end2 = new Date(slot2.godzinaDo).getTime();

  // No overlap if: end1 <= start2 OR start1 >= end2
  const noOverlap = end1 <= start2 || start1 >= end2;

  return !noOverlap;
}

/**
 * Get available time slots for a service variant and optional therapist on a given date
 */
export async function getDostepneSloty(
  data: Date,
  wariantId: string,
  masazystaId?: string
): Promise<Array<{ start: Date; end: Date; masazystaId: string; gabinetId: string }>> {
  const slots: Array<{ start: Date; end: Date; masazystaId: string; gabinetId: string }> = [];

  // Get service variant with duration
  const wariant = await prisma.wariantUslugi.findUnique({
    where: { id: wariantId },
    select: { czasMinut: true },
  });

  if (!wariant) {
    return slots;
  }

  // Use variant duration
  const duration = wariant.czasMinut;

  // Get available therapists
  let therapists = await prisma.masazysta.findMany({
    where: {
      aktywny: true,
      ...(masazystaId && { id: masazystaId }),
    },
    include: {
      grafikPracy: true,
      rezerwacje: true,
    },
  });

  // Get available rooms
  const rooms = await prisma.gabinet.findMany({
    where: { aktywny: true },
    include: { rezerwacje: true },
  });

  // For each therapist, generate slots
  const dayStart = new Date(data);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(data);
  dayEnd.setHours(23, 59, 59, 999);

  for (const therapist of therapists) {
    // Find therapist's schedule for this day
    const schedule = therapist.grafikPracy.find(
      (g) => new Date(g.data).toDateString() === data.toDateString()
    );

    if (!schedule || schedule.status !== 'PRACUJE') {
      continue;
    }

    // Generate slots during working hours
    const currentSlot = new Date(schedule.godzinaOd);
    const endTime = new Date(schedule.godzinaDo);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      if (slotEnd > endTime) {
        break;
      }

      // Check if therapist has conflicting reservation
      const hasConflict = therapist.rezerwacje.some(
        (r) =>
          r.status !== 'ANULOWANA' &&
          r.status !== 'NO_SHOW' &&
          sprawdzNakladanieSie(
            { godzinaOd: currentSlot, godzinaDo: slotEnd },
            { godzinaOd: r.godzinaOd, godzinaDo: r.godzinaDo }
          )
      );

      if (!hasConflict) {
        // Find first available room for this slot
        const availableRoom = rooms.find(
          (room) =>
            !room.rezerwacje.some(
              (r) =>
                r.status !== 'ANULOWANA' &&
                r.status !== 'NO_SHOW' &&
                sprawdzNakladanieSie(
                  { godzinaOd: currentSlot, godzinaDo: slotEnd },
                  { godzinaOd: r.godzinaOd, godzinaDo: r.godzinaDo }
                )
            )
        );

        if (availableRoom) {
          slots.push({
            start: new Date(currentSlot),
            end: new Date(slotEnd),
            masazystaId: therapist.id,
            gabinetId: availableRoom.id,
          });
        }
      }

      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }
  }

  return slots;
}
