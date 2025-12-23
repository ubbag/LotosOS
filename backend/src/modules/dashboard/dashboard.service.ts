import { prisma } from '../../shared/prisma';
import { settingsService } from '../settings/settings.service';

export class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);

    // Get total clients count
    const klienciTotal = await prisma.klient.count();

    // Get today's reservations count (confirmed)
    const rezerwacjeDzisTotal = await prisma.rezerwacja.count({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Get today's confirmed reservations count
    const rezerwacjeDzisPotwierdzoneTotal = await prisma.rezerwacja.count({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'POTWIERDZONA',
      },
    });

    // Get active packages count
    const pakietyAktywne = await prisma.pakietKlienta.count({
      where: {
        status: 'AKTYWNY',
      },
    });

    // Get active vouchers count
    const voucheryAktywne = await prisma.voucher.count({
      where: {
        status: 'AKTYWNY',
      },
    });

    // Get today's revenue from completed and paid reservations
    const rezerwacjeDzisOpłacone = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'ZAKONCZONA',
        platnoscStatus: 'OPLACONA',
      },
    });

    const utargDzis = rezerwacjeDzisOpłacone.reduce((sum, rez) => {
      return sum + (rez.cenaCalokowita || 0);
    }, 0);

    // Get this month's revenue from completed and paid reservations
    const rezerwacjeMiesiacOpłacone = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'ZAKONCZONA',
        platnoscStatus: 'OPLACONA',
      },
    });

    const utargMiesiac = rezerwacjeMiesiacOpłacone.reduce((sum, rez) => {
      return sum + (rez.cenaCalokowita || 0);
    }, 0);

    // Get yesterday's reservations
    const rezerwacjeWczorajTotal = await prisma.rezerwacja.count({
      where: {
        data: {
          gte: yesterday,
          lte: endOfYesterday,
        },
      },
    });

    // Get last month's revenue from completed reservations
    const rezerwacjeLastMonth = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        status: 'ZAKONCZONA',
        platnoscStatus: 'OPLACONA',
      },
    });

    const utargLastMonth = rezerwacjeLastMonth.reduce((sum, rez) => {
      return sum + (rez.cenaCalokowita || 0);
    }, 0);

    // Get last 7 days visits for chart
    const dailyVisits = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const count = await prisma.rezerwacja.count({
        where: {
          data: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const dayName = dayStart.toLocaleDateString('pl-PL', { weekday: 'short' });
      dailyVisits.push({
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        visits: count,
      });
    }

    // Get today's appointments
    const todayAppointments = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay,
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
      },
      orderBy: {
        godzinaOd: 'asc',
      },
      take: 10,
    });

    const formattedAppointments = todayAppointments.map(apt => ({
      id: apt.id,
      time: new Date(apt.godzinaOd).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
      clientName: `${apt.klient.imie} ${apt.klient.nazwisko}`,
      serviceName: apt.usluga.nazwa,
      status: apt.status,
    }));

    // Calculate percentage changes
    const visitChangePercent = rezerwacjeWczorajTotal > 0
      ? Math.round(((rezerwacjeDzisTotal - rezerwacjeWczorajTotal) / rezerwacjeWczorajTotal) * 100)
      : 0;

    const revenueChangePercent = utargLastMonth > 0
      ? Math.round(((utargMiesiac - utargLastMonth) / utargLastMonth) * 100)
      : 0;

    // New clients this month
    const noviKlienciMiesiac = await prisma.klient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Vouchers sold this month and unused
    const voucherySprzedaneMiesiac = await prisma.voucher.count({
      where: {
        dataZakupu: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const voucheryDoWykorzystania = await prisma.voucher.count({
      where: {
        status: 'AKTYWNY',
        wartoscPozostala: {
          gt: 0,
        },
      },
    });

    return {
      klienciTotal,
      rezerwacjeDzisTotal,
      rezerwacjeDzisPotwierdzoneTotal,
      pakietyAktywne,
      voucheryAktywne,
      utargDzis,
      utargMiesiac,
      visitChangePercent,
      revenueChangePercent,
      noviKlienciMiesiac,
      voucherySprzedaneMiesiac,
      voucheryDoWykorzystania,
      dailyVisits,
      todayAppointments: formattedAppointments,
    };
  }

  /**
   * Get hourly visit statistics for today
   */
  async getHourlyStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get salon opening hours from settings
    const openingHours = await settingsService.getOpeningHours();
    const { godzinaOtwarcia, godzinaZamkniecia } = openingHours;

    // Get all today's reservations with their times
    const todayReservations = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        godzinaOd: true,
      },
    });

    // Group reservations by hour (only opening hours)
    const hourlyCount: { [key: number]: number } = {};
    for (let i = godzinaOtwarcia; i <= godzinaZamkniecia; i++) {
      hourlyCount[i] = 0;
    }

    todayReservations.forEach(rez => {
      const hour = new Date(rez.godzinaOd).getHours();
      if (hour >= godzinaOtwarcia && hour <= godzinaZamkniecia) {
        hourlyCount[hour]++;
      }
    });

    // Format for chart (only opening hours)
    const hourlyVisits = [];
    for (let i = godzinaOtwarcia; i <= godzinaZamkniecia; i++) {
      hourlyVisits.push({
        name: `${i.toString().padStart(2, '0')}:00`,
        visits: hourlyCount[i],
      });
    }

    return {
      hourlyVisits,
    };
  }

  /**
   * Get monthly visit statistics
   */
  async getMonthlyStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysInMonth = endOfMonth.getDate();

    // Get all this month's reservations
    const monthReservations = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        data: true,
      },
    });

    // Group by day
    const dailyCount: { [key: number]: number } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      dailyCount[i] = 0;
    }

    monthReservations.forEach(rez => {
      const day = new Date(rez.data).getDate();
      dailyCount[day]++;
    });

    // Format for chart
    const monthlyVisits = [];
    for (let i = 1; i <= daysInMonth; i++) {
      monthlyVisits.push({
        name: i.toString(),
        visits: dailyCount[i],
      });
    }

    return {
      monthlyVisits,
    };
  }
}

export const dashboardService = new DashboardService();
