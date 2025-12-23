import { Klient, NotatkaKlienta } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import {
  CreateKlientRequest,
  UpdateKlientRequest,
  CreateNotatkaRequest,
  ListQueryRequest,
} from './klienci.schemas';

export class KlienciService {
  /**
   * Find all clients with pagination and filtering
   */
  async findAll(filters: ListQueryRequest) {
    const { page, limit, search, filter } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      aktywny: true,
    };

    // Search by phone, first name, last name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { telefon: { contains: searchTerm } },
        { imie: { contains: searchTerm } },
        { nazwisko: { contains: searchTerm } },
      ];
    }

    // Filter by package status
    if (filter === 'Z_PAKIETEM') {
      whereClause.pakietyKlienta = {
        some: {
          status: 'AKTYWNY',
        },
      };
    } else if (filter === 'BEZ_PAKIETU') {
      whereClause.pakietyKlienta = {
        none: {
          status: 'AKTYWNY',
        },
      };
    }

    // Get total count
    const total = await prisma.klient.count({ where: whereClause });

    // Get paginated results
    const klienci = await prisma.klient.findMany({
      where: whereClause,
      include: {
        pakietyKlienta: {
          where: { status: 'AKTYWNY' },
          include: { pakiet: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: klienci,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Quick search for autocomplete
   */
  async search(query: string, limit: number = 10) {
    const searchTerm = query.trim();

    const klienci = await prisma.klient.findMany({
      where: {
        aktywny: true,
        OR: [
          { telefon: { contains: searchTerm } },
          { imie: { contains: searchTerm } },
          { nazwisko: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      select: {
        id: true,
        imie: true,
        nazwisko: true,
        telefon: true,
        email: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return klienci;
  }

  /**
   * Find single client by ID with full details
   */
  async findById(id: string) {
    const klient = await prisma.klient.findUnique({
      where: { id },
      include: {
        notatkiKlienta: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { imie: true, email: true } } },
        },
        pakietyKlienta: {
          where: { status: 'AKTYWNY' },
          include: { pakiet: true },
        },
        rezerwacje: {
          where: { status: 'ZAKONCZONA' },
          take: 10,
          orderBy: { data: 'desc' },
          include: {
            masazysta: { select: { imie: true, nazwisko: true } },
            usluga: { select: { nazwa: true } },
          },
        },
      },
    });

    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    return klient;
  }

  /**
   * Create new client
   */
  async create(data: CreateKlientRequest): Promise<Klient> {
    // Check phone uniqueness
    const existingClient = await prisma.klient.findUnique({
      where: { telefon: data.telefon },
    });

    if (existingClient) {
      throw new ConflictError('Numer telefonu już istnieje');
    }

    const klient = await prisma.klient.create({
      data: {
        imie: data.imie,
        nazwisko: data.nazwisko,
        telefon: data.telefon,
        email: data.email || null,
        zrodlo: data.zrodlo || null,
      },
    });

    return klient;
  }

  /**
   * Update client
   */
  async update(id: string, data: UpdateKlientRequest): Promise<Klient> {
    // Check if client exists
    const klient = await prisma.klient.findUnique({ where: { id } });
    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    // Check phone uniqueness if phone is being updated
    if (data.telefon && data.telefon !== klient.telefon) {
      const existingClient = await prisma.klient.findUnique({
        where: { telefon: data.telefon },
      });
      if (existingClient) {
        throw new ConflictError('Numer telefonu już istnieje');
      }
    }

    const updated = await prisma.klient.update({
      where: { id },
      data: {
        imie: data.imie,
        nazwisko: data.nazwisko,
        telefon: data.telefon,
        email: data.email || null,
        zrodlo: data.zrodlo || null,
      },
    });

    return updated;
  }

  /**
   * Hard delete client (permanently remove from database)
   */
  async delete(id: string): Promise<void> {
    const klient = await prisma.klient.findUnique({
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

    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    // Check if client has active reservations
    if (klient.rezerwacje && klient.rezerwacje.length > 0) {
      throw new ConflictError('Nie można usunąć klienta z aktywnymi rezerwacjami. Anuluj lub zakończ rezerwacje.');
    }

    // Permanently delete client from database
    await prisma.klient.delete({
      where: { id },
    });
  }

  /**
   * Add note to client
   */
  async addNotatka(
    klientId: string,
    data: CreateNotatkaRequest,
    userId: string
  ): Promise<NotatkaKlienta> {
    // Verify client exists
    const klient = await prisma.klient.findUnique({ where: { id: klientId } });
    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    const notatka = await prisma.notatkaKlienta.create({
      data: {
        klientId,
        createdById: userId,
        typ: data.typ,
        tresc: data.tresc,
        pokazujPrzyRezerwacji: data.pokazujPrzyRezerwacji,
      },
    });

    return notatka;
  }

  /**
   * Get client notes
   */
  async getNotatki(klientId: string) {
    const klient = await prisma.klient.findUnique({ where: { id: klientId } });
    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    const notatki = await prisma.notatkaKlienta.findMany({
      where: { klientId },
      include: {
        createdBy: { select: { imie: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return notatki;
  }

  /**
   * Delete note
   */
  async deleteNotatka(klientId: string, notatkaId: string): Promise<void> {
    const notatka = await prisma.notatkaKlienta.findUnique({
      where: { id: notatkaId },
    });

    if (!notatka || notatka.klientId !== klientId) {
      throw new NotFoundError('Notatka nie została znaleziona');
    }

    await prisma.notatkaKlienta.delete({ where: { id: notatkaId } });
  }

  /**
   * Get client visit history
   */
  async getHistoriaWizyt(
    klientId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const klient = await prisma.klient.findUnique({ where: { id: klientId } });
    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    const skip = (page - 1) * limit;

    const total = await prisma.rezerwacja.count({
      where: { klientId, status: 'ZAKONCZONA' },
    });

    const rezerwacje = await prisma.rezerwacja.findMany({
      where: { klientId, status: 'ZAKONCZONA' },
      include: {
        masazysta: { select: { imie: true, nazwisko: true } },
        usluga: { select: { nazwa: true } },
        wariant: { select: { czasMinut: true, cenaRegularna: true } },
      },
      orderBy: { data: 'desc' },
      skip,
      take: limit,
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
}

export const klienciService = new KlienciService();
