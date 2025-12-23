import { Voucher } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError, ConflictError, ValidationError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { CreateVoucherRequest, RealizujRequest, VoucherFiltersRequest } from './vouchery.schemas';
import { generujKod } from './vouchery.utils';

export class VoucheryService {
  /**
   * Find all vouchers with filters
   */
  async findAll(filters: Partial<VoucherFiltersRequest>) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.typ) {
      where.typ = filters.typ;
    }
    if (filters.zrodlo) {
      where.zrodlo = filters.zrodlo;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [vouchery, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: {
          usluga: {
            select: {
              id: true,
              nazwa: true,
            },
          },
          realizacje: {
            select: {
              id: true,
              kwota: true,
              data: true,
              rezerwacja: {
                select: {
                  numer: true,
                },
              },
            },
          },
        },
        orderBy: { dataZakupu: 'desc' },
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    return {
      data: vouchery,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find voucher by ID with full realization history
   */
  async findById(id: string) {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        usluga: {
          select: {
            id: true,
            nazwa: true,
          },
        },
        realizacje: {
          include: {
            rezerwacja: {
              select: {
                numer: true,
                data: true,
                godzinaOd: true,
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
            },
          },
          orderBy: { data: 'desc' },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher nie został znaleziony');
    }

    return voucher;
  }

  /**
   * Find voucher by code (public method for form)
   * Validates code, checks status and validity
   */
  async findByKod(kod: string) {
    const voucher = await prisma.voucher.findUnique({
      where: { kod },
      include: {
        usluga: {
          select: {
            id: true,
            nazwa: true,
          },
        },
      },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher nie został znaleziony');
    }

    // Check status
    if (voucher.status === 'WYKORZYSTANY') {
      throw new ConflictError('Voucher został już wykorzystany');
    }

    if (voucher.status === 'WYGASLY') {
      throw new ConflictError('Voucher wygasł');
    }

    // Check validity date
    const teraz = new Date();
    if (voucher.dataWaznosci < teraz) {
      throw new ConflictError('Data ważności vouchera minęła');
    }

    return {
      id: voucher.id,
      kod: voucher.kod,
      typ: voucher.typ,
      wartoscPoczatkowa: voucher.wartoscPoczatkowa,
      wartoscPozostala: voucher.wartoscPozostala,
      usluga: voucher.usluga,
      kupujacyImie: voucher.kupujacyImie,
      obdarowanyImie: voucher.obdarowanyImie,
      wiadomosc: voucher.wiadomosc,
      dataWaznosci: voucher.dataWaznosci,
    };
  }

  /**
   * Create and sell voucher
   */
  async create(data: CreateVoucherRequest, userId: string) {
    let wartoscPoczatkowa: number;
    let uslugaId: string | null = null;
    let iloscGodzin: number | null = null;
    let wartoscKatalogowa: number | null = null;

    // Calculate or fetch value
    if (data.typ === 'KWOTOWY') {
      if (!data.wartosc) {
        throw new ValidationError({ wartosc: ['Value is required for KWOTOWY voucher'] }, 'Invalid data');
      }
      wartoscPoczatkowa = parseFloat(data.wartosc.toString());
    } else {
      // USLUGOWY
      if (!data.uslugaId || !data.iloscGodzin) {
        throw new ValidationError({ uslugaId: ['Service ID and hours count are required for USLUGOWY voucher'] }, 'Invalid data');
      }

      iloscGodzin = data.iloscGodzin;

      const usluga = await prisma.usluga.findUnique({
        where: { id: data.uslugaId },
        include: {
          wariantyUslugi: {
            orderBy: { cenaRegularna: 'asc' }, // Order by price to get cheapest
          },
        },
      });

      if (!usluga) {
        throw new NotFoundError('Service not found');
      }

      if (!usluga.aktywna) {
        throw new ConflictError('Usługa nie jest aktywna');
      }

      // Use price from cheapest variant
      if (usluga.wariantyUslugi.length === 0) {
        throw new ConflictError('Usługa nie ma wariantów');
      }

      const najnizszyCenowy = usluga.wariantyUslugi[0]; // cheapest variant
      const cenaZaGodzine = najnizszyCenowy.cenaRegularna / (najnizszyCenowy.czasMinut / 60);

      // Calculate catalog value: cheapest price per hour × hours count
      wartoscKatalogowa = Math.round(cenaZaGodzine * iloscGodzin * 100) / 100;

      // For voucher value, use catalog value or cheapest variant price
      wartoscPoczatkowa = wartoscKatalogowa;
      uslugaId = data.uslugaId;
    }

    // Generate unique code
    const kod = await generujKod();

    // Calculate validity date (use provided or default 365 days from now)
    const dataWaznosci = data.dataWaznosci ? new Date(data.dataWaznosci) : (() => {
      const date = new Date();
      date.setDate(date.getDate() + 365);
      return date;
    })();

    // Create voucher and transaction
    const result = await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          kod,
          typ: data.typ,
          wartoscPoczatkowa,
          wartoscPozostala: wartoscPoczatkowa,
          uslugaId,
          iloscGodzin,
          wartoscKatalogowa,
          kupujacyImie: data.kupujacyImie,
          kupujacyEmail: data.kupujacyEmail ? data.kupujacyEmail : '',
          obdarowanyImie: data.obdarowanyImie,
          obdarowanyEmail: data.obdarowanyEmail,
          wiadomosc: data.wiadomosc,
          dataZakupu: new Date(),
          dataWaznosci,
          status: 'AKTYWNY',
          zrodlo: data.zrodlo || 'RECEPCJA',
        },
        include: {
          usluga: {
            select: {
              nazwa: true,
            },
          },
        },
      });

      // Create transaction record
      await tx.transakcja.create({
        data: {
          voucherId: voucher.id,
          typ: 'WPLATA',
          kwota: wartoscPoczatkowa,
          metoda: data.metoda,
          userId,
          notatki: data.typ === 'KWOTOWY'
            ? `Sprzedaż vouchera: ${kod} (${wartoscPoczatkowa} zł)`
            : `Sprzedaż vouchera: ${kod}`,
        },
      });

      return voucher;
    });

    return result;
  }

  /**
   * Realize voucher (use it for a reservation)
   */
  async realizuj(voucherId: string, { rezerwacjaId, kwota }: RealizujRequest) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher nie został znaleziony');
    }

    // Check status
    if (voucher.status === 'WYKORZYSTANY') {
      throw new ConflictError('Voucher został już wykorzystany');
    }

    if (voucher.status === 'WYGASLY') {
      throw new ConflictError('Voucher wygasł');
    }

    // Check validity date
    const teraz = new Date();
    if (voucher.dataWaznosci < teraz) {
      throw new ConflictError('Data ważności vouchera minęła');
    }

    // Check reservation exists
    const rezerwacja = await prisma.rezerwacja.findUnique({
      where: { id: rezerwacjaId },
    });

    if (!rezerwacja) {
      throw new NotFoundError('Rezerwacja nie została znaleziona');
    }

    // Validate amount
    const kwotaDecimal = new Decimal(kwota);
    if (kwotaDecimal.gt(voucher.wartoscPozostala)) {
      throw new ConflictError('Niewystarczające saldo vouchera');
    }

    // Create realization and update voucher in transaction
    const result = await prisma.$transaction(async (tx) => {
      const saldoPo = voucher.wartoscPozostala - kwotaDecimal.toNumber();

      // Create realization record
      const realizacja = await tx.realizacjaVouchera.create({
        data: {
          voucherId,
          rezerwacjaId,
          kwota: kwotaDecimal.toNumber(),
          saldoPo,
        },
      });

      // Update voucher balance
      const newStatus = saldoPo <= 0 ? 'WYKORZYSTANY' : 'AKTYWNY';
      await tx.voucher.update({
        where: { id: voucherId },
        data: {
          wartoscPozostala: saldoPo,
          status: newStatus,
        },
      });

      return realizacja;
    });

    return result;
  }

  /**
   * Extend voucher validity
   */
  async przedluz(id: string, nowaDataWaznosci: Date): Promise<Voucher> {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher nie został znaleziony');
    }

    if (nowaDataWaznosci <= voucher.dataWaznosci) {
      throw new ValidationError(
        { nowaDataWaznosci: ['New validity date must be after current date'] },
        'Invalid date'
      );
    }

    return prisma.voucher.update({
      where: { id },
      data: {
        dataWaznosci: nowaDataWaznosci,
      },
    });
  }

  /**
   * Cancel voucher
   */
  async anuluj(id: string): Promise<Voucher> {
    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      throw new NotFoundError('Voucher nie został znaleziony');
    }

    if (voucher.status === 'WYKORZYSTANY') {
      throw new ConflictError('Nie można anulować wykorzystanego vouchera');
    }

    return prisma.voucher.update({
      where: { id },
      data: {
        status: 'WYGASLY',
      },
    });
  }

  /**
   * Find vouchers expiring soon (within specified days)
   */
  async findWygasajace(dni: number = 30) {
    const dataOd = new Date();
    const dataDo = new Date();
    dataDo.setDate(dataDo.getDate() + dni);

    return prisma.voucher.findMany({
      where: {
        status: 'AKTYWNY',
        dataWaznosci: {
          gte: dataOd,
          lte: dataDo,
        },
      },
      include: {
        usluga: {
          select: {
            nazwa: true,
          },
        },
      },
      orderBy: { dataWaznosci: 'asc' },
    });
  }

  /**
   * Update status of expired vouchers (cron job)
   */
  async aktualizujStatusyWygaslych(): Promise<number> {
    const teraz = new Date();

    const result = await prisma.voucher.updateMany({
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

export const voucheryService = new VoucheryService();
