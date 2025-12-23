import { Gabinet } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { CreateGabinetRequest, UpdateGabinetRequest } from './gabinety.schemas';

export class GabinetyService {
  /**
   * Find all active rooms
   */
  async findAll() {
    const gabinety = await prisma.gabinet.findMany({
      where: { aktywny: true },
      orderBy: { numer: 'asc' },
    });

    return gabinety;
  }

  /**
   * Find room by ID
   */
  async findById(id: string) {
    const gabinet = await prisma.gabinet.findUnique({
      where: { id },
    });

    if (!gabinet) {
      throw new NotFoundError('Room not found');
    }

    return gabinet;
  }

  /**
   * Create new room
   */
  async create(data: CreateGabinetRequest): Promise<Gabinet> {
    // Check if room number already exists
    const existing = await prisma.gabinet.findUnique({
      where: { numer: data.numer },
    });

    if (existing) {
      throw new ConflictError('Room number already exists');
    }

    const gabinet = await prisma.gabinet.create({
      data: {
        numer: data.numer,
        nazwa: data.nazwa,
        aktywny: true,
      },
    });

    return gabinet;
  }

  /**
   * Update room
   */
  async update(id: string, data: UpdateGabinetRequest): Promise<Gabinet> {
    const gabinet = await prisma.gabinet.findUnique({ where: { id } });
    if (!gabinet) {
      throw new NotFoundError('Room not found');
    }

    // Check if room number is unique (if being updated)
    if (data.numer && data.numer !== gabinet.numer) {
      const existing = await prisma.gabinet.findUnique({
        where: { numer: data.numer },
      });
      if (existing) {
        throw new ConflictError('Room number already exists');
      }
    }

    const updated = await prisma.gabinet.update({
      where: { id },
      data: {
        numer: data.numer,
        nazwa: data.nazwa,
        aktywny: data.aktywny,
      },
    });

    return updated;
  }

  /**
   * Check if room is available for given time slot
   * Returns true if room is free, false if booked
   */
  async sprawdzCzyWolny(
    gabinetId: string,
    data: string,
    godzinaOd: Date,
    godzinaDo: Date,
    excludeRezerwacjaId?: string
  ): Promise<boolean> {
    // Parse date string to get the day
    const dayDate = new Date(data);

    // Find all active reservations for this room on this day with overlapping time
    const conflictingReservations = await prisma.rezerwacja.findMany({
      where: {
        gabinetId,
        status: {
          in: ['NOWA', 'POTWIERDZONA', 'W TRAKCIE'],
        },
        // Filter by date
        data: {
          gte: new Date(dayDate.setHours(0, 0, 0, 0)),
          lt: new Date(dayDate.setHours(23, 59, 59, 999)),
        },
        // Exclude current reservation if provided
        ...(excludeRezerwacjaId && { id: { not: excludeRezerwacjaId } }),
      },
    });

    // Check if any reservation overlaps with requested time
    for (const rez of conflictingReservations) {
      // Check if requested time overlaps with existing reservation
      const requestStart = new Date(godzinaOd).getTime();
      const requestEnd = new Date(godzinaDo).getTime();
      const existingStart = new Date(rez.godzinaOd).getTime();
      const existingEnd = new Date(rez.godzinaDo).getTime();

      // No overlap if: requestEnd <= existingStart OR requestStart >= existingEnd
      const noOverlap = requestEnd <= existingStart || requestStart >= existingEnd;

      if (!noOverlap) {
        return false; // Room is booked
      }
    }

    return true; // Room is available
  }

  /**
   * Get room availability for a given date
   */
  async getAvailabilityForDate(
    gabinetId: string,
    data: string,
    startHour: number = 6,
    endHour: number = 22
  ) {
    const gabinet = await prisma.gabinet.findUnique({
      where: { id: gabinetId },
    });

    if (!gabinet) {
      throw new NotFoundError('Room not found');
    }

    // Get all reservations for this room on this day
    const dayDate = new Date(data);
    const reservations = await prisma.rezerwacja.findMany({
      where: {
        gabinetId,
        status: {
          in: ['NOWA', 'POTWIERDZONA', 'W TRAKCIE'],
        },
        data: {
          gte: new Date(dayDate.setHours(0, 0, 0, 0)),
          lt: new Date(dayDate.setHours(23, 59, 59, 999)),
        },
      },
      select: {
        godzinaOd: true,
        godzinaDo: true,
      },
    });

    // Build availability slots (30-minute intervals)
    const slots: Array<{ start: string; end: string; available: boolean }> = [];

    const currentSlot = new Date(dayDate);
    currentSlot.setHours(startHour, 0, 0, 0);

    const dayEnd = new Date(dayDate);
    dayEnd.setHours(endHour, 0, 0, 0);

    while (currentSlot < dayEnd) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      // Check if slot overlaps with any reservation
      let isAvailable = true;
      for (const rez of reservations) {
        const rezStart = new Date(rez.godzinaOd).getTime();
        const rezEnd = new Date(rez.godzinaDo).getTime();
        const slotStart = currentSlot.getTime();
        const slotEndTime = slotEnd.getTime();

        const hasOverlap = slotStart < rezEnd && slotEndTime > rezStart;
        if (hasOverlap) {
          isAvailable = false;
          break;
        }
      }

      slots.push({
        start: currentSlot.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
      });

      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    return slots;
  }
}

export const gabinetyService = new GabinetyService();
