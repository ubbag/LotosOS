import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';

export class RaportyService {
  /**
   * REVENUE REPORTS
   */

  /**
   * Get daily revenue from confirmed and paid reservations
   */
  async getUtargDzienny(data: Date) {
    const dayStart = new Date(data);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data);
    dayEnd.setHours(23, 59, 59, 999);

    // Get confirmed and paid reservations for the day
    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: 'POTWIERDZONA',
        statusPlatnosci: 'OPLACONA',
      },
      include: {
        usluga: {
          select: {
            cena: true,
          },
        },
      },
    });

    // Group by payment method
    const byMethod: Record<string, Decimal> = {
      GOTOWKA: new Decimal(0),
      KARTA: new Decimal(0),
      PRZELEW: new Decimal(0),
      MIESZANE: new Decimal(0),
    };

    let total = new Decimal(0);

    rezerwacje.forEach((rez) => {
      const kwota = new Decimal(rez.cenaKoncowa || rez.usluga?.cena || 0);
      if (rez.platnoscMetoda in byMethod) {
        byMethod[rez.platnoscMetoda] = byMethod[rez.platnoscMetoda].plus(kwota);
      }
      total = total.plus(kwota);
    });

    // Get total number of clients
    const klienciTotal = await prisma.klient.count();

    return {
      data: data.toISOString().split('T')[0],
      utarg: parseFloat(total.toFixed(2)),
      metody: {
        gotowka: parseFloat(byMethod.GOTOWKA.toFixed(2)),
        karta: parseFloat(byMethod.KARTA.toFixed(2)),
        przelew: parseFloat(byMethod.PRZELEW.toFixed(2)),
        mieszane: parseFloat(byMethod.MIESZANE.toFixed(2)),
      },
      liczbaRezerwacji: rezerwacje.length,
      liczbaKlientow: klienciTotal,
    };
  }

  /**
   * Get monthly revenue from confirmed and paid reservations
   */
  async getUtargMiesieczy(rok: number, miesiac: number) {
    const monthStart = new Date(rok, miesiac - 1, 1);
    const monthEnd = new Date(rok, miesiac, 0, 23, 59, 59, 999);

    // Get confirmed and paid reservations for the month
    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: monthStart,
          lte: monthEnd,
        },
        status: 'POTWIERDZONA',
        statusPlatnosci: 'OPLACONA',
      },
      include: {
        usluga: {
          select: {
            cena: true,
          },
        },
      },
    });

    // Group by day
    const byDay: Record<string, { gotowka: Decimal; karta: Decimal; przelew: Decimal; mieszane: Decimal; total: Decimal; liczbaRezerwacji: number }> = {};

    rezerwacje.forEach((rez) => {
      const dayStr = rez.data.toISOString().split('T')[0];
      if (!byDay[dayStr]) {
        byDay[dayStr] = {
          gotowka: new Decimal(0),
          karta: new Decimal(0),
          przelew: new Decimal(0),
          mieszane: new Decimal(0),
          total: new Decimal(0),
          liczbaRezerwacji: 0,
        };
      }

      const kwota = new Decimal(rez.cenaKoncowa || rez.usluga?.cena || 0);
      if (rez.platnoscMetoda === 'GOTOWKA') {
        byDay[dayStr].gotowka = byDay[dayStr].gotowka.plus(kwota);
      } else if (rez.platnoscMetoda === 'KARTA') {
        byDay[dayStr].karta = byDay[dayStr].karta.plus(kwota);
      } else if (rez.platnoscMetoda === 'PRZELEW') {
        byDay[dayStr].przelew = byDay[dayStr].przelew.plus(kwota);
      } else if (rez.platnoscMetoda === 'MIESZANE') {
        byDay[dayStr].mieszane = byDay[dayStr].mieszane.plus(kwota);
      }
      byDay[dayStr].total = byDay[dayStr].total.plus(kwota);
      byDay[dayStr].liczbaRezerwacji += 1;
    });

    // Convert to array and sort
    const result = Object.entries(byDay)
      .map(([data, metody]) => ({
        data,
        suma: parseFloat(metody.total.toFixed(2)),
        metody: {
          gotowka: parseFloat(metody.gotowka.toFixed(2)),
          karta: parseFloat(metody.karta.toFixed(2)),
          przelew: parseFloat(metody.przelew.toFixed(2)),
          online: parseFloat(metody.online.toFixed(2)),
        },
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return result;
  }

  /**
   * Get yearly revenue breakdown by month
   */
  async getUtargRoczny(rok: number) {
    const yearStart = new Date(rok, 0, 1);
    const yearEnd = new Date(rok, 11, 31, 23, 59, 59, 999);

    const transakcje = await prisma.transakcja.findMany({
      where: {
        data: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    // Group by month
    const byMonth: Record<number, Decimal> = {};
    for (let i = 1; i <= 12; i++) {
      byMonth[i] = new Decimal(0);
    }

    transakcje.forEach((t) => {
      const month = t.data.getMonth() + 1;
      const kwota = t.typ === 'WPLATA' ? t.kwota : new Decimal(0).minus(t.kwota);
      byMonth[month] = byMonth[month].plus(kwota);
    });

    const result = Object.entries(byMonth)
      .map(([month, suma]) => ({
        miesiac: parseInt(month),
        suma: parseFloat(suma.toFixed(2)),
      }))
      .sort((a, b) => a.miesiac - b.miesiac);

    return result;
  }

  /**
   * THERAPIST SETTLEMENT
   */

  /**
   * Get therapist settlement for period
   */
  async getRozliczenie(odDaty: Date, doDaty: Date) {
    const masazysci = await prisma.masazysta.findMany({
      where: { aktywny: true },
      include: {
        rezerwacje: {
          where: {
            data: {
              gte: odDaty,
              lte: doDaty,
            },
            status: {
              in: ['ZAKONCZONA', 'POTWIERDZONA'],
            },
          },
          include: {
            wariant: {
              select: {
                czasMinut: true,
                cenaRegularna: true,
              },
            },
            rezerwacjeDoplata: {
              include: {
                doplata: true,
              },
            },
          },
        },
      },
    });

    const rozliczenia = masazysci.map((m) => {
      let totalHours = 0;
      let totalValue = new Decimal(0);

      m.rezerwacje.forEach((r) => {
        const hours = r.wariant?.czasMinut ? r.wariant.czasMinut / 60 : 0;
        totalHours += hours;

        const basePrice = r.wariant?.cenaRegularna || new Decimal(0);
        totalValue = totalValue.plus(basePrice);

        // Add add-ons
        r.rezerwacjeDoplata.forEach((d) => {
          totalValue = totalValue.plus(d.cena);
        });
      });

      // Assume 15% commission
      const prowizja = totalValue.times(0.15);

      return {
        masazystaId: m.id,
        imie: m.imie,
        nazwisko: m.nazwisko,
        liczbaRezerwacji: m.rezerwacje.length,
        liczbaGodzin: parseFloat(totalHours.toFixed(2)),
        wartoscUslug: parseFloat(totalValue.toFixed(2)),
        prowizja: parseFloat(prowizja.toFixed(2)),
      };
    });

    return rozliczenia.filter((r) => r.liczbaRezerwacji > 0);
  }

  /**
   * Get detailed settlement for single therapist
   */
  async getRozliczenieSzczegoly(masazystaId: string, odDaty: Date, doDaty: Date) {
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: masazystaId },
    });

    if (!masazysta) {
      throw new NotFoundError('Therapist not found');
    }

    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        masazystaId,
        data: {
          gte: odDaty,
          lte: doDaty,
        },
        status: {
          in: ['ZAKONCZONA', 'POTWIERDZONA'],
        },
      },
      include: {
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
        wariant: {
          select: {
            czasMinut: true,
            cenaRegularna: true,
          },
        },
        rezerwacjeDoplata: {
          include: {
            doplata: {
              select: {
                nazwa: true,
                cena: true,
              },
            },
          },
        },
      },
      orderBy: { data: 'asc' },
    });

    return rezerwacje.map((r) => ({
      id: r.id,
      numer: r.numer,
      data: r.data.toISOString().split('T')[0],
      klient: `${r.klient.imie} ${r.klient.nazwisko}`,
      usluga: r.usluga.nazwa,
      czasMinut: r.wariant?.czasMinut || 0,
      cenaBazowa: parseFloat((r.wariant?.cenaRegularna || new Decimal(0)).toString()),
      doplaty: r.rezerwacjeDoplata.map((d) => ({
        nazwa: d.doplata.nazwa,
        cena: parseFloat(d.cena.toFixed(2)),
      })),
    }));
  }

  /**
   * STATISTICS
   */

  /**
   * Get top 10 popular services
   */
  async getPopularneUslugi(okres: string) {
    const dataOd = this.getPeriodStart(okres);
    const dataDo = new Date();

    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: dataOd,
          lte: dataDo,
        },
        status: 'ZAKONCZONA',
      },
      include: {
        usluga: {
          select: {
            id: true,
            nazwa: true,
          },
        },
      },
    });

    // Count by service
    const byService: Record<string, { nazwa: string; count: number }> = {};

    rezerwacje.forEach((r) => {
      if (!byService[r.uslugaId]) {
        byService[r.uslugaId] = { nazwa: r.usluga.nazwa, count: 0 };
      }
      byService[r.uslugaId].count++;
    });

    return Object.values(byService)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get peak hours heatmap
   */
  async getGodzinySzczytu(okres: string) {
    const dataOd = this.getPeriodStart(okres);
    const dataDo = new Date();

    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: dataOd,
          lte: dataDo,
        },
        status: 'ZAKONCZONA',
      },
      select: {
        godzinaOd: true,
      },
    });

    // Group by day of week and hour
    const heatmap: Record<number, Record<number, number>> = {};
    for (let dow = 0; dow < 7; dow++) {
      heatmap[dow] = {};
      for (let hour = 6; hour <= 21; hour++) {
        heatmap[dow][hour] = 0;
      }
    }

    rezerwacje.forEach((r) => {
      const dow = r.godzinaOd.getDay();
      const hour = r.godzinaOd.getHours();
      if (heatmap[dow] && heatmap[dow][hour] !== undefined) {
        heatmap[dow][hour]++;
      }
    });

    return heatmap;
  }

  /**
   * Get room occupancy percentage
   */
  async getOblozeniePercent(odDaty: Date, doDaty: Date) {
    const gabinety = await prisma.gabinet.findMany({
      where: { aktywny: true },
      include: {
        rezerwacje: {
          where: {
            data: {
              gte: odDaty,
              lte: doDaty,
            },
            status: {
              in: ['POTWIERDZONA', 'W TRAKCIE', 'ZAKONCZONA'],
            },
          },
          select: {
            godzinaOd: true,
            godzinaDo: true,
          },
        },
      },
    });

    // Calculate occupancy for each room
    const results = gabinety.map((g) => {
      // Estimate: 10 hours/day * days in range
      const dayCount = Math.ceil((doDaty.getTime() - odDaty.getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const totalSlots = 20 * dayCount; // 2 slots per hour for 10 hours

      let bookedSlots = 0;
      g.rezerwacje.forEach((r) => {
        const durationMinutes = (r.godzinaDo.getTime() - r.godzinaOd.getTime()) / (1000 * 60);
        bookedSlots += Math.ceil(durationMinutes / 30); // 30-min slots
      });

      const occupancy = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

      return {
        gabinetId: g.id,
        numer: g.numer,
        nazwa: g.nazwa,
        rezerwacji: g.rezerwacje.length,
        oblozenieProc: occupancy,
      };
    });

    return results;
  }

  /**
   * CLOSURES
   */

  /**
   * Get list of day closures
   */
  async getZamkniecia(odDaty: Date, doDaty: Date) {
    return prisma.zamkniecieDnia.findMany({
      where: {
        data: {
          gte: odDaty,
          lte: doDaty,
        },
      },
      include: {
        user: {
          select: {
            imie: true,
          },
        },
      },
      orderBy: { data: 'desc' },
    });
  }

  /**
   * Get single day closure
   */
  async getZamkniecieDnia(data: Date) {
    const dayStart = new Date(data);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data);
    dayEnd.setHours(23, 59, 59, 999);

    const zamkniecie = await prisma.zamkniecieDnia.findFirst({
      where: {
        data: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        user: {
          select: {
            imie: true,
          },
        },
      },
    });

    if (!zamkniecie) {
      throw new NotFoundError('Day closure not found');
    }

    return zamkniecie;
  }

  /**
   * Get day summary for closure form
   */
  async getPodsumowanieDnia(data: Date) {
    const dayStart = new Date(data);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data);
    dayEnd.setHours(23, 59, 59, 999);

    const transakcje = await prisma.transakcja.findMany({
      where: {
        data: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const byMethod: Record<string, Decimal> = {
      GOTOWKA: new Decimal(0),
      KARTA: new Decimal(0),
      PRZELEW: new Decimal(0),
    };

    transakcje.forEach((t) => {
      if (t.typ === 'WPLATA' && (t.metoda === 'GOTOWKA' || t.metoda === 'KARTA' || t.metoda === 'PRZELEW')) {
        byMethod[t.metoda] = byMethod[t.metoda].plus(t.kwota);
      }
    });

    return {
      data: data.toISOString().split('T')[0],
      gotowkaSpodziewana: parseFloat(byMethod.GOTOWKA.toFixed(2)),
      kartaSpodziewana: parseFloat(byMethod.KARTA.toFixed(2)),
      przlewSpodziewany: parseFloat(byMethod.PRZELEW.toFixed(2)),
    };
  }

  /**
   * Close the day
   */
  async zamknijDzien(data: Date, gotowkaRzeczywista: string, kartaRzeczywista: string, uwagi: string | undefined, userId: string) {
    const dayStart = new Date(data);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(data);
    dayEnd.setHours(23, 59, 59, 999);

    // Check if already closed
    const existing = await prisma.zamkniecieDnia.findFirst({
      where: {
        data: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Day already closed');
    }

    // Get expected values
    const podsumowanie = await this.getPodsumowanieDnia(data);

    const gotowkaR = new Decimal(gotowkaRzeczywista);
    const kartaR = new Decimal(kartaRzeczywista);
    const utargSpodziewany = new Decimal(podsumowanie.gotowkaSpodziewana).plus(podsumowanie.kartaSpodziewana);
    const utargRzeczywisty = gotowkaR.plus(kartaR);
    const roznica = utargRzeczywisty.minus(utargSpodziewany);

    return prisma.zamkniecieDnia.create({
      data: {
        data,
        utargSpodziewany: utargSpodziewany.toNumber(),
        utargRzeczywisty: utargRzeczywisty.toNumber(),
        roznica: roznica.toNumber(),
        gotowkaSpodziewana: parseFloat(podsumowanie.gotowkaSpodziewana.toString()),
        gotowkaRzeczywista: gotowkaR.toNumber(),
        kartaSpodziewana: parseFloat(podsumowanie.kartaSpodziewana.toString()),
        kartaRzeczywista: kartaR.toNumber(),
        userId,
        uwagi: uwagi || null,
      },
    });
  }

  /**
   * HELPERS
   */

  private getPeriodStart(okres: string): Date {
    const teraz = new Date();
    const result = new Date(teraz);

    switch (okres) {
      case 'tydzien':
        result.setDate(result.getDate() - 7);
        break;
      case 'miesiac':
        result.setMonth(result.getMonth() - 1);
        break;
      case 'kwartал':
        result.setMonth(result.getMonth() - 3);
        break;
      case 'rok':
        result.setFullYear(result.getFullYear() - 1);
        break;
      default:
        result.setMonth(result.getMonth() - 1);
    }

    return result;
  }
}

export const raportyService = new RaportyService();
