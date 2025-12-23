import { PakietDefinicja, PakietKlienta, WykorzystaniePakietu } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { CreateDefinicjaRequest, UpdateDefinicjaRequest, SprzedajPakietRequest } from './pakiety.schemas';

export class PakietyService {
  /**
   * Package Definitions
   */

  /**
   * Get all package definitions
   */
  async findAllDefinicje(): Promise<PakietDefinicja[]> {
    return prisma.pakietDefinicja.findMany({
      where: { aktywny: true },
      orderBy: { liczbaGodzin: 'asc' },
    });
  }

  /**
   * Create new package definition
   */
  async createDefinicja(data: CreateDefinicjaRequest): Promise<PakietDefinicja> {
    const cena = parseFloat(data.cena.toString());

    return prisma.pakietDefinicja.create({
      data: {
        nazwa: data.nazwa,
        liczbaGodzin: data.liczbaGodzin,
        cena,
        waznoscDni: data.waznoscDni,
        aktywny: true,
      },
    });
  }

  /**
   * Update package definition
   */
  async updateDefinicja(id: string, data: UpdateDefinicjaRequest): Promise<PakietDefinicja> {
    const definicja = await prisma.pakietDefinicja.findUnique({ where: { id } });
    if (!definicja) {
      throw new NotFoundError('Definicja pakietu nie została znaleziona');
    }

    const cena = data.cena ? parseFloat(data.cena.toString()) : undefined;

    return prisma.pakietDefinicja.update({
      where: { id },
      data: {
        nazwa: data.nazwa,
        liczbaGodzin: data.liczbaGodzin,
        cena,
        waznoscDni: data.waznoscDni,
      },
    });
  }

  /**
   * Client Packages
   */

  /**
   * Find all client packages (without filtering by client)
   */
  async findAll() {
    const pakiety = await prisma.pakietKlienta.findMany({
      include: {
        pakiet: true,
        klient: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
            telefon: true,
            email: true,
          },
        },
      },
      orderBy: { dataZakupu: 'desc' },
    });

    return pakiety;
  }

  /**
   * Find all packages for a client
   */
  async findByKlient(klientId: string, tylkoAktywne: boolean = false) {
    const where: any = { klientId };
    if (tylkoAktywne) {
      where.status = 'AKTYWNY';
    }

    const pakiety = await prisma.pakietKlienta.findMany({
      where,
      include: {
        pakiet: true,
        wykorzystania: {
          include: {
            rezerwacja: {
              select: {
                numer: true,
                data: true,
              },
            },
          },
          orderBy: { data: 'desc' },
          take: 5,
        },
      },
      orderBy: { dataZakupu: 'desc' },
    });

    return pakiety;
  }

  /**
   * Find active package for a client (only one)
   */
  async findAktywnyByKlient(klientId: string): Promise<PakietKlienta | null> {
    return prisma.pakietKlienta.findFirst({
      where: {
        klientId,
        status: 'AKTYWNY',
      },
      include: {
        pakiet: true,
      },
    });
  }

  /**
   * Find package by ID with full usage history
   */
  async findById(id: string) {
    const pakiet = await prisma.pakietKlienta.findUnique({
      where: { id },
      include: {
        pakiet: true,
        klient: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
            telefon: true,
            email: true,
          },
        },
      },
    });

    if (!pakiet) {
      throw new NotFoundError('Pakiet nie został znaleziony');
    }

    // Get full usage history with pagination support
    const wykorzystania = await prisma.wykorzystaniePakietu.findMany({
      where: { pakietKlientaId: id },
      include: {
        rezerwacja: {
          select: {
            numer: true,
            data: true,
            godzinaOd: true,
            usluga: {
              select: {
                nazwa: true,
              },
            },
          },
        },
      },
      orderBy: { data: 'desc' },
    });

    return {
      ...pakiet,
      wykorzystania,
    };
  }

  /**
   * Sell package to client
   */
  async sprzedajPakiet(
    data: SprzedajPakietRequest,
    userId: string
  ) {
    // Validate client exists
    const klient = await prisma.klient.findUnique({
      where: { id: data.klientId },
    });
    if (!klient) {
      throw new NotFoundError('Klient nie został znaleziony');
    }

    // Validate package definition exists
    const definicja = await prisma.pakietDefinicja.findUnique({
      where: { id: data.pakietDefinicjaId },
    });
    if (!definicja) {
      throw new NotFoundError('Definicja pakietu nie została znaleziona');
    }

    if (!definicja.aktywny) {
      throw new ConflictError('Definicja pakietu nie jest aktywna');
    }

    // Check if client already has active package
    const aktywnyPakiet = await this.findAktywnyByKlient(data.klientId);
    if (aktywnyPakiet) {
      throw new ConflictError('Klient ma już aktywny pakiet. Najpierw wygaś istniejący pakiet.');
    }

    // Create package and transaction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Calculate validity date
      const dataWaznosci = new Date();
      dataWaznosci.setDate(dataWaznosci.getDate() + definicja.waznoscDni);

      // Create package
      const pakiet = await tx.pakietKlienta.create({
        data: {
          klientId: data.klientId,
          pakietId: data.pakietDefinicjaId,
          godzinyWykupione: definicja.liczbaGodzin,
          godzinyWykorzystane: 0,
          godzinyPozostale: definicja.liczbaGodzin,
          dataWaznosci,
          status: 'AKTYWNY',
        },
        include: {
          pakiet: true,
        },
      });

      // Create transaction record
      await tx.transakcja.create({
        data: {
          pakietKlientaId: pakiet.id,
          typ: 'WPLATA',
          kwota: definicja.cena,
          metoda: data.metoda,
          userId,
          notatki: `Sprzedaż pakietu: ${definicja.nazwa} (${definicja.liczbaGodzin}h)`,
        },
      });

      return pakiet;
    });

    return result;
  }

  /**
   * Usage Tracking
   */

  /**
   * Use hours from package (called when reservation is created)
   */
  async wykorzystajGodziny(
    pakietKlientaId: string,
    rezerwacjaId: string,
    godziny: number
  ): Promise<WykorzystaniePakietu> {
    const pakiet = await prisma.pakietKlienta.findUnique({
      where: { id: pakietKlientaId },
    });

    if (!pakiet) {
      throw new NotFoundError('Pakiet nie został znaleziony');
    }

    if (pakiet.godzinyPozostale < godziny) {
      throw new ConflictError(
        `Insufficient package balance. Required: ${godziny}h, Available: ${pakiet.godzinyPozostale}h`
      );
    }

    // Create usage record and update package in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create usage record
      const wykorzystanie = await tx.wykorzystaniePakietu.create({
        data: {
          pakietKlientaId,
          rezerwacjaId,
          wykorzystaneGodziny: godziny,
        },
      });

      // Update package balance
      await tx.pakietKlienta.update({
        where: { id: pakietKlientaId },
        data: {
          godzinyWykorzystane: {
            increment: godziny,
          },
          godzinyPozostale: {
            decrement: godziny,
          },
        },
      });

      return wykorzystanie;
    });

    return result;
  }

  /**
   * Return hours to package (when reservation is cancelled)
   */
  async zwrocGodziny(pakietKlientaId: string, rezerwacjaId: string): Promise<void> {
    // Find and delete the usage record
    const wykorzystanie = await prisma.wykorzystaniePakietu.findFirst({
      where: {
        pakietKlientaId,
        rezerwacjaId,
      },
    });

    if (!wykorzystanie) {
      throw new NotFoundError('Rekord wykorzystania pakietu nie został znaleziony');
    }

    const godziny = wykorzystanie.wykorzystaneGodziny;

    // Delete usage record and update package in transaction
    await prisma.$transaction(async (tx) => {
      // Delete usage record
      await tx.wykorzystaniePakietu.delete({
        where: { id: wykorzystanie.id },
      });

      // Update package balance
      await tx.pakietKlienta.update({
        where: { id: pakietKlientaId },
        data: {
          godzinyWykorzystane: {
            decrement: godziny,
          },
          godzinyPozostale: {
            increment: godziny,
          },
        },
      });
    });
  }

  /**
   * Alerts
   */

  /**
   * Find packages ending soon (remaining < 2 hours)
   */
  async findKonczaceSie() {
    return prisma.pakietKlienta.findMany({
      where: {
        status: 'AKTYWNY',
        godzinyPozostale: {
          lt: 2,
        },
      },
      include: {
        pakiet: true,
        klient: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
            telefon: true,
            email: true,
          },
        },
      },
      orderBy: { godzinyPozostale: 'asc' },
    });
  }

  /**
   * Find packages expiring soon (validity date within specified days)
   */
  async findWygasajace(dni: number = 30) {
    const dataOd = new Date();
    const dataDo = new Date();
    dataDo.setDate(dataDo.getDate() + dni);

    return prisma.pakietKlienta.findMany({
      where: {
        status: 'AKTYWNY',
        dataWaznosci: {
          gte: dataOd,
          lte: dataDo,
        },
      },
      include: {
        pakiet: true,
        klient: {
          select: {
            id: true,
            imie: true,
            nazwisko: true,
            telefon: true,
            email: true,
          },
        },
      },
      orderBy: { dataWaznosci: 'asc' },
    });
  }

  /**
   * Update status of expired packages (cron job)
   */
  async aktualizujStatusyWygaslych(): Promise<number> {
    const teraz = new Date();

    const result = await prisma.pakietKlienta.updateMany({
      where: {
        status: 'AKTYWNY',
        dataWaznosci: {
          lt: teraz,
        },
      },
      data: {
        status: 'WYGASLY',
      },
    });

    return result.count;
  }
}

export const pakietyService = new PakietyService();
