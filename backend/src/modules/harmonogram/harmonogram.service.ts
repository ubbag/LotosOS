import { GrafikPracy, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError as AppValidationError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import {
  CreateGrafikRequest,
  UpdateGrafikRequest,
  ListGrafikQuery,
  BulkCreateGrafikRequest,
} from './harmonogram.schemas';

export class HarmonogramService {
  /**
   * Create new schedule entry
   */
  async createGrafik(data: CreateGrafikRequest, _userId: string): Promise<GrafikPracy> {
    // Validate therapist exists and is active
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: data.masazystaId },
    });

    if (!masazysta || !masazysta.aktywny) {
      throw new NotFoundError('Therapist not found or inactive');
    }

    // Parse dates
    const dataDate = new Date(data.data);
    const godzinaOd = new Date(data.godzinaOd);
    const godzinaDo = new Date(data.godzinaDo);

    // Validate time range
    if (godzinaDo <= godzinaOd) {
      throw new AppValidationError(
        { godzinaDo: ['End time must be after start time'] },
        'Invalid time range'
      );
    }

    // Check if therapist already has schedule for this date
    const startOfDay = new Date(dataDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dataDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSchedule = await prisma.grafikPracy.findFirst({
      where: {
        masazystaId: data.masazystaId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingSchedule) {
      throw new ConflictError('Therapist already has schedule for this date');
    }

    // Create schedule
    const grafik = await prisma.grafikPracy.create({
      data: {
        masazystaId: data.masazystaId,
        data: dataDate,
        godzinaOd,
        godzinaDo,
        status: data.status,
      },
    });

    return grafik;
  }

  /**
   * Get schedule by ID
   */
  async getGrafikById(id: string) {
    const grafik = await prisma.grafikPracy.findUnique({
      where: { id },
      include: {
        masazysta: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
          },
        },
      },
    });

    if (!grafik) {
      throw new NotFoundError('Schedule not found');
    }

    return grafik;
  }

  /**
   * List schedules with filters and pagination
   */
  async listGrafiki(query: ListGrafikQuery) {
    const { page, limit, masazystaId, data, dataOd, dataDo, status } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.GrafikPracyWhereInput = {};

    if (masazystaId) {
      whereClause.masazystaId = masazystaId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Handle date filters
    if (data) {
      const targetDate = new Date(data);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.data = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (dataOd && dataDo) {
      whereClause.data = {
        gte: new Date(dataOd),
        lte: new Date(dataDo),
      };
    } else if (dataOd) {
      whereClause.data = {
        gte: new Date(dataOd),
      };
    } else if (dataDo) {
      whereClause.data = {
        lte: new Date(dataDo),
      };
    }

    // Get total count
    const total = await prisma.grafikPracy.count({ where: whereClause });

    // Get paginated results
    const grafiki = await prisma.grafikPracy.findMany({
      where: whereClause,
      include: {
        masazysta: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: [{ data: 'desc' }, { godzinaOd: 'asc' }],
    });

    return {
      data: grafiki,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update schedule
   */
  async updateGrafik(id: string, data: UpdateGrafikRequest): Promise<GrafikPracy> {
    // Check if schedule exists
    const existing = await prisma.grafikPracy.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Schedule not found');
    }

    // Validate therapist if being updated
    if (data.masazystaId) {
      const masazysta = await prisma.masazysta.findUnique({
        where: { id: data.masazystaId },
      });
      if (!masazysta || !masazysta.aktywny) {
        throw new NotFoundError('Therapist not found or inactive');
      }
    }

    // Validate time range if times are being updated
    const godzinaOd = data.godzinaOd ? new Date(data.godzinaOd) : existing.godzinaOd;
    const godzinaDo = data.godzinaDo ? new Date(data.godzinaDo) : existing.godzinaDo;

    if (godzinaDo <= godzinaOd) {
      throw new AppValidationError(
        { godzinaDo: ['End time must be after start time'] },
        'Invalid time range'
      );
    }

    // Check for conflicts if date or therapist is being changed
    if (data.data || data.masazystaId) {
      const masazystaId = data.masazystaId || existing.masazystaId;
      const dataDate = data.data ? new Date(data.data) : existing.data;

      const startOfDay = new Date(dataDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dataDate);
      endOfDay.setHours(23, 59, 59, 999);

      const conflictingSchedule = await prisma.grafikPracy.findFirst({
        where: {
          id: { not: id },
          masazystaId,
          data: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (conflictingSchedule) {
        throw new ConflictError('Therapist already has schedule for this date');
      }
    }

    // Update schedule
    const updated = await prisma.grafikPracy.update({
      where: { id },
      data: {
        masazystaId: data.masazystaId,
        data: data.data ? new Date(data.data) : undefined,
        godzinaOd: data.godzinaOd ? new Date(data.godzinaOd) : undefined,
        godzinaDo: data.godzinaDo ? new Date(data.godzinaDo) : undefined,
        status: data.status,
      },
    });

    return updated;
  }

  /**
   * Delete schedule
   */
  async deleteGrafik(id: string): Promise<void> {
    const grafik = await prisma.grafikPracy.findUnique({ where: { id } });
    if (!grafik) {
      throw new NotFoundError('Schedule not found');
    }

    // Check if there are any reservations for this schedule
    const reservations = await prisma.rezerwacja.count({
      where: {
        masazystaId: grafik.masazystaId,
        data: grafik.data,
        status: {
          notIn: ['ANULOWANA', 'NO_SHOW'],
        },
      },
    });

    if (reservations > 0) {
      throw new ConflictError('Cannot delete schedule with active reservations');
    }

    await prisma.grafikPracy.delete({ where: { id } });
  }

  /**
   * Get therapist schedule for date range
   */
  async getGrafikByTherapist(masazystaId: string, dataOd: Date, dataDo: Date) {
    // Validate therapist exists
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: masazystaId },
    });

    if (!masazysta) {
      throw new NotFoundError('Therapist not found');
    }

    const grafiki = await prisma.grafikPracy.findMany({
      where: {
        masazystaId,
        data: {
          gte: dataOd,
          lte: dataDo,
        },
      },
      orderBy: [{ data: 'asc' }, { godzinaOd: 'asc' }],
    });

    return grafiki;
  }

  /**
   * Bulk create schedules
   */
  async bulkCreateGrafiki(data: BulkCreateGrafikRequest, _userId: string): Promise<GrafikPracy[]> {
    const created: GrafikPracy[] = [];
    const errors: string[] = [];

    // Validate all therapists exist
    const therapistIds = [...new Set(data.schedules.map((s) => s.masazystaId))];
    const therapists = await prisma.masazysta.findMany({
      where: { id: { in: therapistIds } },
    });

    if (therapists.length !== therapistIds.length) {
      throw new NotFoundError('Some therapists not found');
    }

    const inactiveTherapists = therapists.filter((t) => !t.aktywny);
    if (inactiveTherapists.length > 0) {
      throw new AppValidationError(
        { therapists: ['Some therapists are inactive'] },
        'Invalid therapists'
      );
    }

    // Process each schedule
    for (let i = 0; i < data.schedules.length; i++) {
      const schedule = data.schedules[i];
      try {
        // Parse dates
        const dataDate = new Date(schedule.data);
        const godzinaOd = new Date(schedule.godzinaOd);
        const godzinaDo = new Date(schedule.godzinaDo);

        // Validate time range
        if (godzinaDo <= godzinaOd) {
          errors.push(`Schedule ${i + 1}: End time must be after start time`);
          continue;
        }

        // Check for existing schedule
        const startOfDay = new Date(dataDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dataDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingSchedule = await prisma.grafikPracy.findFirst({
          where: {
            masazystaId: schedule.masazystaId,
            data: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });

        if (existingSchedule) {
          errors.push(`Schedule ${i + 1}: Therapist already has schedule for this date`);
          continue;
        }

        // Create schedule
        const grafik = await prisma.grafikPracy.create({
          data: {
            masazystaId: schedule.masazystaId,
            data: dataDate,
            godzinaOd,
            godzinaDo,
            status: schedule.status,
          },
        });

        created.push(grafik);
      } catch (error) {
        errors.push(`Schedule ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0 && created.length === 0) {
      throw new AppValidationError(
        { schedules: errors },
        'Failed to create any schedules'
      );
    }

    return created;
  }

  /**
   * Get therapist availability for a specific date
   */
  async getTherapistAvailability(masazystaId: string, date: Date) {
    // Validate therapist exists
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: masazystaId },
    });

    if (!masazysta || !masazysta.aktywny) {
      throw new NotFoundError('Therapist not found or inactive');
    }

    // Get schedule for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const schedule = await prisma.grafikPracy.findFirst({
      where: {
        masazystaId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (!schedule) {
      return {
        available: false,
        reason: 'No schedule for this date',
        schedule: null,
        reservations: [],
      };
    }

    if (schedule.status !== 'PRACUJE') {
      return {
        available: false,
        reason: `Therapist status: ${schedule.status}`,
        schedule,
        reservations: [],
      };
    }

    // Get reservations for the date
    const reservations = await prisma.rezerwacja.findMany({
      where: {
        masazystaId,
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['ANULOWANA', 'NO_SHOW'],
        },
      },
      orderBy: { godzinaOd: 'asc' },
      select: {
        id: true,
        godzinaOd: true,
        godzinaDo: true,
        status: true,
        klient: {
          select: {
            imie: true,
            nazwisko: true,
          },
        },
        usluga: {
          select: {
            nazwa: true,
          },
        },
      },
    });

    return {
      available: true,
      reason: null,
      schedule,
      reservations,
    };
  }
}

export const harmonogramService = new HarmonogramService();
