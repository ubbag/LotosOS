import { Rezerwacja, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, ValidationError as AppValidationError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import {
  CreateRezerwacjaRequest,
  UpdateRezerwacjaRequest,
  UpdateStatusRezerwacjiRequest,
  UpdatePlatnoscRequest,
  ListRezerwacjiQuery,
} from './rezerwacje.schemas';

export class RezerwacjeService {
  /**
   * Create new reservation with full validation
   */
  async createRezerwacja(data: CreateRezerwacjaRequest, userId: string): Promise<Rezerwacja> {
    // Validate client exists
    const klient = await prisma.klient.findUnique({
      where: { id: data.klientId },
    });
    if (!klient || !klient.aktywny) {
      throw new NotFoundError('Klient nie został znaleziony lub jest nieaktywny');
    }

    // Validate therapist exists and is active
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: data.masazystaId },
    });
    if (!masazysta || !masazysta.aktywny) {
      throw new NotFoundError('Masażysta nie został znaleziony lub jest nieaktywny');
    }

    // Validate cabinet exists and is active
    const gabinet = await prisma.gabinet.findUnique({
      where: { id: data.gabinetId },
    });
    if (!gabinet || !gabinet.aktywny) {
      throw new NotFoundError('Gabinet nie został znaleziony lub jest nieaktywny');
    }

    // Validate service and variant
    const usluga = await prisma.usluga.findUnique({
      where: { id: data.uslugaId },
    });
    if (!usluga || !usluga.aktywna) {
      throw new NotFoundError('Usługa nie została znaleziona lub jest nieaktywna');
    }

    const wariant = await prisma.wariantUslugi.findUnique({
      where: { id: data.wariantId },
    });
    if (!wariant) {
      throw new NotFoundError('Wariant usługi nie został znaleziony');
    }
    if (wariant.uslugaId !== data.uslugaId) {
      throw new AppValidationError(
        { wariantId: ['Wariant nie należy do wybranej usługi'] },
        'Nieprawidłowy wariant usługi'
      );
    }

    // Check availability
    const godzinaOd = new Date(data.godzinaOd);
    const godzinaDo = new Date(data.godzinaDo);

    const isAvailable = await this.checkAvailability(
      data.masazystaId,
      data.gabinetId,
      godzinaOd,
      godzinaDo
    );

    if (!isAvailable) {
      throw new ConflictError('Masażysta lub gabinet nie jest dostępny w wybranym terminie');
    }

    // Validate doplaty if provided
    if (data.doplaty && data.doplaty.length > 0) {
      const doplataIds = data.doplaty.map((d) => d.doplataId);
      const doplaty = await prisma.doplata.findMany({
        where: { id: { in: doplataIds } },
      });

      if (doplaty.length !== doplataIds.length) {
        throw new NotFoundError('Niektóre dopłaty nie zostały znalezione');
      }

      const inactiveDoplaty = doplaty.filter((d) => !d.aktywna);
      if (inactiveDoplaty.length > 0) {
        throw new AppValidationError(
          { doplaty: ['Niektóre dopłaty nie są aktywne'] },
          'Nieprawidłowe dopłaty'
        );
      }
    }

    // Create reservation in transaction
    const rezerwacja = await prisma.$transaction(async (tx) => {
      // Generate reservation number inside transaction to avoid race conditions
      const numer = await this.generateReservationNumber(tx);

      // Create main reservation
      const rez = await tx.rezerwacja.create({
        data: {
          numer,
          klientId: data.klientId,
          masazystaId: data.masazystaId,
          gabinetId: data.gabinetId,
          uslugaId: data.uslugaId,
          wariantId: data.wariantId,
          data: new Date(data.data),
          godzinaOd,
          godzinaDo,
          cenaCalokowita: parseFloat(data.cenaCalokowita.toString()),
          status: 'NOWA',
          zrodlo: data.zrodlo,
          platnoscMetoda: data.platnoscMetoda,
          platnoscStatus: 'NIEOPLACONA',
          notatki: data.notatki || null,
          createdById: userId,
        },
      });

      // Add add-ons if provided
      if (data.doplaty && data.doplaty.length > 0) {
        for (const doplata of data.doplaty) {
          await tx.rezerwacjaDoplata.create({
            data: {
              rezerwacjaId: rez.id,
              doplataId: doplata.doplataId,
              cena: parseFloat(doplata.cena.toString()),
            },
          });
        }
      }

      return rez;
    });

    return rezerwacja;
  }

  /**
   * Get reservation by ID with full details
   */
  async getRezerwacjaById(id: string) {
    const rezerwacja = await prisma.rezerwacja.findUnique({
      where: { id },
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
        masazysta: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
          },
        },
        gabinet: {
          select: {
            id: true,
            numer: true,
            nazwa: true,
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
        rezerwacjeDoplata: {
          include: {
            doplata: {
              select: {
                id: true,
                nazwa: true,
                cena: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            imie: true,
            email: true,
          },
        },
      },
    });

    if (!rezerwacja) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    return rezerwacja;
  }

  /**
   * List reservations with filters and pagination
   */
  async listRezerwacje(query: ListRezerwacjiQuery) {
    const { page, limit, status, klientId, masazystaId, gabinetId, dataOd, dataDo, platnoscStatus } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.RezerwacjaWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    if (klientId) {
      whereClause.klientId = klientId;
    }

    if (masazystaId) {
      whereClause.masazystaId = masazystaId;
    }

    if (gabinetId) {
      whereClause.gabinetId = gabinetId;
    }

    if (dataOd && dataDo) {
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

    if (platnoscStatus) {
      whereClause.platnoscStatus = platnoscStatus;
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
          },
        },
        masazysta: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
          },
        },
        gabinet: {
          select: {
            id: true,
            numer: true,
            nazwa: true,
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
      skip,
      take: limit,
      orderBy: [{ data: 'desc' }, { godzinaOd: 'desc' }],
    });

    return {
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
   * Update reservation
   */
  async updateRezerwacja(id: string, data: UpdateRezerwacjaRequest): Promise<Rezerwacja> {
    // Check if reservation exists
    const existing = await prisma.rezerwacja.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    // Don't allow updates to completed or cancelled reservations
    if (existing.status === 'ZAKONCZONA' || existing.status === 'ANULOWANA') {
      throw new ConflictError('Nie można aktualizować zakończonej lub anulowanej rezerwacji');
    }

    // If changing time or resources, check availability
    if (data.godzinaOd || data.godzinaDo || data.masazystaId || data.gabinetId) {
      const masazystaId = data.masazystaId || existing.masazystaId;
      const gabinetId = data.gabinetId || existing.gabinetId;
      const godzinaOd = data.godzinaOd ? new Date(data.godzinaOd) : existing.godzinaOd;
      const godzinaDo = data.godzinaDo ? new Date(data.godzinaDo) : existing.godzinaDo;

      const isAvailable = await this.checkAvailability(
        masazystaId,
        gabinetId,
        godzinaOd,
        godzinaDo,
        id
      );

      if (!isAvailable) {
        throw new ConflictError('Masażysta lub gabinet nie jest dostępny w wybranym terminie');
      }
    }

    // Validate foreign keys if being updated
    if (data.klientId) {
      const klient = await prisma.klient.findUnique({ where: { id: data.klientId } });
      if (!klient || !klient.aktywny) {
        throw new NotFoundError('Klient nie został znaleziony lub jest nieaktywny');
      }
    }

    if (data.masazystaId) {
      const masazysta = await prisma.masazysta.findUnique({ where: { id: data.masazystaId } });
      if (!masazysta || !masazysta.aktywny) {
        throw new NotFoundError('Masażysta nie został znaleziony lub jest nieaktywny');
      }
    }

    if (data.gabinetId) {
      const gabinet = await prisma.gabinet.findUnique({ where: { id: data.gabinetId } });
      if (!gabinet || !gabinet.aktywny) {
        throw new NotFoundError('Gabinet nie został znaleziony lub jest nieaktywny');
      }
    }

    if (data.uslugaId) {
      const usluga = await prisma.usluga.findUnique({ where: { id: data.uslugaId } });
      if (!usluga || !usluga.aktywna) {
        throw new NotFoundError('Usługa nie została znaleziona lub jest nieaktywna');
      }
    }

    if (data.wariantId) {
      const wariant = await prisma.wariantUslugi.findUnique({ where: { id: data.wariantId } });
      if (!wariant) {
        throw new NotFoundError('Wariant usługi nie został znaleziony');
      }
    }

    // Update reservation in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update main reservation
      const rez = await tx.rezerwacja.update({
        where: { id },
        data: {
          klientId: data.klientId,
          masazystaId: data.masazystaId,
          gabinetId: data.gabinetId,
          uslugaId: data.uslugaId,
          wariantId: data.wariantId,
          data: data.data ? new Date(data.data) : undefined,
          godzinaOd: data.godzinaOd ? new Date(data.godzinaOd) : undefined,
          godzinaDo: data.godzinaDo ? new Date(data.godzinaDo) : undefined,
          cenaCalokowita: data.cenaCalokowita !== undefined ? parseFloat(data.cenaCalokowita.toString()) : undefined,
          zrodlo: data.zrodlo,
          platnoscMetoda: data.platnoscMetoda,
          notatki: data.notatki !== undefined ? data.notatki : undefined,
        },
      });

      // Update doplaty if provided
      if (data.doplaty) {
        // Remove old doplaty
        await tx.rezerwacjaDoplata.deleteMany({
          where: { rezerwacjaId: id },
        });

        // Add new doplaty
        if (data.doplaty.length > 0) {
          for (const doplata of data.doplaty) {
            await tx.rezerwacjaDoplata.create({
              data: {
                rezerwacjaId: id,
                doplataId: doplata.doplataId,
                cena: parseFloat(doplata.cena.toString()),
              },
            });
          }
        }
      }

      return rez;
    });

    return updated;
  }

  /**
   * Update reservation status
   */
  async updateStatusRezerwacji(id: string, data: UpdateStatusRezerwacjiRequest): Promise<Rezerwacja> {
    const existing = await prisma.rezerwacja.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    const updated = await prisma.rezerwacja.update({
      where: { id },
      data: {
        status: data.status,
        notatki: data.notatki !== undefined ? data.notatki : undefined,
      },
    });

    return updated;
  }

  /**
   * Update payment status
   */
  async updatePlatnoscStatus(id: string, data: UpdatePlatnoscRequest): Promise<Rezerwacja> {
    const existing = await prisma.rezerwacja.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    const updated = await prisma.rezerwacja.update({
      where: { id },
      data: {
        platnoscStatus: data.platnoscStatus,
        platnoscMetoda: data.platnoscMetoda,
        notatki: data.notatki !== undefined ? data.notatki : undefined,
      },
    });

    return updated;
  }

  /**
   * Cancel reservation (set status to ANULOWANA)
   */
  async cancelRezerwacja(id: string): Promise<Rezerwacja> {
    const existing = await prisma.rezerwacja.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    if (existing.status === 'ZAKONCZONA') {
      throw new ConflictError('Nie można anulować zakończonej rezerwacji');
    }

    if (existing.status === 'ANULOWANA') {
      throw new ConflictError('Rezerwacja jest już anulowana');
    }

    const updated = await prisma.rezerwacja.update({
      where: { id },
      data: {
        status: 'ANULOWANA',
      },
    });

    return updated;
  }

  /**
   * Permanently delete reservation from database
   */
  async deleteRezerwacja(id: string): Promise<void> {
    const existing = await prisma.rezerwacja.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    // Delete the reservation permanently
    await prisma.rezerwacja.delete({
      where: { id },
    });
  }

  /**
   * Check availability for therapist and cabinet at specific time
   */
  async checkAvailability(
    masazystaId: string,
    gabinetId: string,
    godzinaOd: Date,
    godzinaDo: Date,
    excludeRezerwacjaId?: string
  ): Promise<boolean> {
    const whereClause: Prisma.RezerwacjaWhereInput = {
      status: {
        notIn: ['ANULOWANA', 'NO_SHOW'],
      },
      OR: [
        { masazystaId },
        { gabinetId },
      ],
      AND: [
        {
          godzinaOd: {
            lt: godzinaDo,
          },
        },
        {
          godzinaDo: {
            gt: godzinaOd,
          },
        },
      ],
    };

    // Exclude current reservation if updating
    if (excludeRezerwacjaId) {
      whereClause.id = {
        not: excludeRezerwacjaId,
      };
    }

    const conflicts = await prisma.rezerwacja.findMany({
      where: whereClause,
    });

    return conflicts.length === 0;
  }

  /**
   * Get reservations by client ID
   */
  async getRezerwacjeByKlient(klientId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const total = await prisma.rezerwacja.count({
      where: { klientId },
    });

    const rezerwacje = await prisma.rezerwacja.findMany({
      where: { klientId },
      include: {
        masazysta: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
          },
        },
        gabinet: {
          select: {
            id: true,
            numer: true,
            nazwa: true,
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
      skip,
      take: limit,
      orderBy: [{ data: 'desc' }, { godzinaOd: 'desc' }],
    });

    return {
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
   * Generate unique reservation number
   * Format: R-YYYY-XXXXXX (e.g., R-2024-000001)
   */
  private async generateReservationNumber(tx?: any): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `R-${year}-`;

    // Use transaction if provided, otherwise use regular prisma
    const db = tx || prisma;

    // Get the last reservation number for this year
    const lastReservation = await db.rezerwacja.findFirst({
      where: {
        numer: {
          startsWith: prefix,
        },
      },
      orderBy: {
        numer: 'desc',
      },
      select: {
        numer: true,
      },
    });

    let sequence = 1;
    if (lastReservation) {
      // Extract sequence from last number (R-2025-000001 -> 000001)
      const lastSequence = lastReservation.numer.split('-')[2];
      sequence = parseInt(lastSequence, 10) + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }
}

export const rezerwacjeService = new RezerwacjeService();
