import { Masazysta } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import {
  CreateMasazystaRequest,
  UpdateMasazystaRequest,
  ListMasazysciQueryRequest,
  GetScheduleQueryRequest,
  GetReservationsQueryRequest,
} from './masazysci.schemas';

export class MasazysciService {
  /**
   * Find all therapists with pagination and filtering
   */
  async findAll(filters: ListMasazysciQueryRequest) {
    const { page, limit, search, aktywny } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {};

    // Filter by aktywny status if provided
    if (aktywny !== undefined) {
      whereClause.aktywny = aktywny;
    }

    // Search by name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { imie: { contains: searchTerm, mode: 'insensitive' as const } },
        { nazwisko: { contains: searchTerm, mode: 'insensitive' as const } },
      ];
    }

    // Get total count
    const total = await prisma.masazysta.count({ where: whereClause });

    // Get paginated results
    const masazysci = await prisma.masazysta.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: [{ kolejnosc: 'asc' }, { nazwisko: 'asc' }],
    });

    return {
      data: masazysci,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find single therapist by ID with schedule and reservations
   */
  async findById(id: string) {
    const masazysta = await prisma.masazysta.findUnique({
      where: { id },
      include: {
        grafikPracy: {
          where: {
            data: {
              gte: new Date(),
            },
          },
          orderBy: { data: 'asc' },
          take: 30, // Next 30 days of schedule
        },
        rezerwacje: {
          where: {
            data: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)), // From today
            },
            status: {
              in: ['NOWA', 'POTWIERDZONA', 'W TRAKCIE'],
            },
          },
          orderBy: { godzinaOd: 'asc' },
          take: 20, // Next 20 upcoming reservations
          include: {
            klient: {
              select: {
                id: true,
                imie: true,
                nazwisko: true,
                telefon: true,
              },
            },
            usluga: {
              select: {
                id: true,
                nazwa: true,
              },
            },
            wariant: {
              select: {
                czasMinut: true,
              },
            },
          },
        },
      },
    });

    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    return masazysta;
  }

  /**
   * Create new therapist
   */
  async create(data: CreateMasazystaRequest): Promise<Masazysta> {
    const masazysta = await prisma.masazysta.create({
      data: {
        imie: data.imie,
        nazwisko: data.nazwisko,
        specjalizacje: JSON.stringify(data.specjalizacje || []),
        jezyki: JSON.stringify(data.jezyki || []),
        zdjecieUrl: data.zdjecieUrl || null,
        kolejnosc: data.kolejnosc ?? 0,
        aktywny: true,
      },
    });

    return masazysta;
  }

  /**
   * Update therapist
   */
  async update(id: string, data: UpdateMasazystaRequest): Promise<Masazysta> {
    // Check if therapist exists
    const masazysta = await prisma.masazysta.findUnique({ where: { id } });
    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    const updateData: any = {};

    if (data.imie !== undefined) updateData.imie = data.imie;
    if (data.nazwisko !== undefined) updateData.nazwisko = data.nazwisko;
    if (data.specjalizacje !== undefined) updateData.specjalizacje = JSON.stringify(data.specjalizacje);
    if (data.jezyki !== undefined) updateData.jezyki = JSON.stringify(data.jezyki);
    if (data.zdjecieUrl !== undefined) updateData.zdjecieUrl = data.zdjecieUrl || null;
    if (data.kolejnosc !== undefined) updateData.kolejnosc = data.kolejnosc;

    const updated = await prisma.masazysta.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Hard delete therapist (permanently remove from database)
   */
  async delete(id: string): Promise<void> {
    const masazysta = await prisma.masazysta.findUnique({
      where: { id },
      include: {
        rezerwacje: {
          where: {
            status: {
              notIn: ['ANULOWANA', 'ZAKONCZONA']
            }
          }
        }
      }
    });

    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    // Check if therapist has active reservations
    if (masazysta.rezerwacje && masazysta.rezerwacje.length > 0) {
      throw new ConflictError('Nie można usunąć masażysty z aktywnymi rezerwacjami. Anuluj lub zakończ rezerwacje.');
    }

    // Delete therapist (schedule entries will be deleted automatically via cascade)
    await prisma.masazysta.delete({
      where: { id },
    });
  }

  /**
   * Get therapist schedule for a date range
   */
  async getGrafik(id: string, query: GetScheduleQueryRequest) {
    // Verify therapist exists
    const masazysta = await prisma.masazysta.findUnique({
      where: { id },
      select: { id: true, imie: true, nazwisko: true },
    });

    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    const dataOd = new Date(query.dataOd);
    const dataDo = new Date(query.dataDo);

    // Validate date range
    if (dataOd > dataDo) {
      throw new Error('Start date must be before or equal to end date');
    }

    const grafik = await prisma.grafikPracy.findMany({
      where: {
        masazystaId: id,
        data: {
          gte: dataOd,
          lte: dataDo,
        },
      },
      orderBy: { data: 'asc' },
    });

    return {
      masazysta: {
        id: masazysta.id,
        imie: masazysta.imie,
        nazwisko: masazysta.nazwisko,
      },
      dataOd: query.dataOd,
      dataDo: query.dataDo,
      grafik,
    };
  }

  /**
   * Get therapist reservations with filters
   */
  async getRezerwacje(id: string, filters: GetReservationsQueryRequest) {
    // Verify therapist exists
    const masazysta = await prisma.masazysta.findUnique({
      where: { id },
      select: { id: true, imie: true, nazwisko: true },
    });

    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    const { page, limit, status, dataOd, dataDo } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      masazystaId: id,
    };

    // Filter by status if provided
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range if provided
    if (dataOd || dataDo) {
      whereClause.data = {};
      if (dataOd) {
        whereClause.data.gte = new Date(dataOd);
      }
      if (dataDo) {
        whereClause.data.lte = new Date(dataDo);
      }
    }

    // Get total count
    const total = await prisma.rezerwacja.count({ where: whereClause });

    // Get paginated results
    const rezerwacje = await prisma.rezerwacja.findMany({
      where: whereClause,
      include: {
        klient: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
            telefon: true,
            email: true,
          },
        },
        usluga: {
          select: {
            id: true,
            nazwa: true,
            kategoria: true,
          },
        },
        wariant: {
          select: {
            id: true,
            czasMinut: true,
            cenaRegularna: true,
            cenaPromocyjna: true,
          },
        },
        gabinet: {
          select: {
            id: true,
            numer: true,
            nazwa: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { godzinaOd: 'desc' },
    });

    return {
      masazysta: {
        id: masazysta.id,
        imie: masazysta.imie,
        nazwisko: masazysta.nazwisko,
      },
      data: rezerwacje,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get therapist statistics
   */
  async getStatistics(id: string) {
    // Verify therapist exists
    const masazysta = await prisma.masazysta.findUnique({ where: { id } });
    if (!masazysta) {
      throw new NotFoundError('Masażysta nie został znaleziony');
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    // Count reservations by status
    const [
      totalRezerwacje,
      thisMonthRezerwacje,
      thisWeekRezerwacje,
      zakonczoneRezerwacje,
      anulowaneRezerwacje,
    ] = await Promise.all([
      prisma.rezerwacja.count({ where: { masazystaId: id } }),
      prisma.rezerwacja.count({
        where: {
          masazystaId: id,
          data: { gte: startOfMonth },
        },
      }),
      prisma.rezerwacja.count({
        where: {
          masazystaId: id,
          data: { gte: startOfWeek },
        },
      }),
      prisma.rezerwacja.count({
        where: {
          masazystaId: id,
          status: 'ZAKONCZONA',
        },
      }),
      prisma.rezerwacja.count({
        where: {
          masazystaId: id,
          status: 'ANULOWANA',
        },
      }),
    ]);

    return {
      totalRezerwacje,
      thisMonthRezerwacje,
      thisWeekRezerwacje,
      zakonczoneRezerwacje,
      anulowaneRezerwacje,
    };
  }
}

export const masazysciService = new MasazysciService();
