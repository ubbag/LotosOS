import { Rezerwacja, PakietKlienta } from '@prisma/client';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { smsProvider } from './sms.provider';
import { renderSMSTemplate } from './sms.templates';

export class SMSService {
  /**
   * Send SMS to client by klientId or direct phone number
   */
  async wyslij(
    klientIdOrPhone: string,
    tresc: string,
    typ: string = 'MARKETING',
    rezerwacjaId?: string,
    isDirectPhone: boolean = false
  ): Promise<any> {
    let telefon: string;
    let klientId: string | null = null;

    if (isDirectPhone) {
      // Direct phone number
      telefon = klientIdOrPhone;
    } else {
      // Validate client exists
      const klient = await prisma.klient.findUnique({
        where: { id: klientIdOrPhone },
      });

      if (!klient) {
        throw new NotFoundError('Klient nie znaleziony');
      }

      if (!klient.telefon) {
        throw new ConflictError('Klient nie ma numeru telefonu');
      }

      telefon = klient.telefon;
      klientId = klientIdOrPhone;
    }

    let status: string = 'WYSLANY';
    let bladOpis: string | null = null;

    try {
      // Send SMS via provider
      const result = await smsProvider.send(telefon, tresc);
      status = result.status === 'WYSLANY' ? 'WYSLANY' : result.status;
    } catch (error) {
      status = 'BLAD';
      bladOpis = error instanceof Error ? error.message : 'Nieznany błąd';
      console.error('SMS send error:', error);
    }

    // Log SMS in database (klientId can be null for direct phone sends)
    const smsLog = await prisma.sMSLog.create({
      data: {
        klientId,
        rezerwacjaId: rezerwacjaId || null,
        typ,
        tresc,
        status,
        bladOpis,
      },
    });

    return smsLog;
  }

  /**
   * Send reservation confirmation SMS
   */
  async wyslijPotwierdzenie(rezerwacja: Rezerwacja & { usluga?: { nazwa: string }; klient?: { imie: string; nazwisko: string } }): Promise<any> {
    // Fetch full reservation data if not provided
    const fullRezerwacja = rezerwacja.usluga
      ? rezerwacja
      : await prisma.rezerwacja.findUnique({
          where: { id: rezerwacja.id },
          include: {
            usluga: { select: { nazwa: true } },
            klient: { select: { imie: true, nazwisko: true } },
          },
        });

    if (!fullRezerwacja) {
      throw new NotFoundError('Reservation not found');
    }

    const data = fullRezerwacja.data.toLocaleDateString('pl-PL');
    const godzina = fullRezerwacja.godzinaOd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const usluga = fullRezerwacja.usluga?.nazwa || 'Usługa';

    const template = renderSMSTemplate('POTWIERDZENIE', {
      data,
      godzina,
      usluga,
    });

    return this.wyslij(fullRezerwacja.klientId, template, 'POTWIERDZENIE', rezerwacja.id);
  }

  /**
   * Send reservation reminder SMS
   */
  async wyslijPrzypomnienie(rezerwacja: Rezerwacja & { usluga?: { nazwa: string }; masazysta?: { imie: string; nazwisko: string } }): Promise<any> {
    // Fetch full reservation data if not provided
    const fullRezerwacja = rezerwacja.usluga
      ? rezerwacja
      : await prisma.rezerwacja.findUnique({
          where: { id: rezerwacja.id },
          include: {
            usluga: { select: { nazwa: true } },
            masazysta: { select: { imie: true, nazwisko: true } },
          },
        });

    if (!fullRezerwacja) {
      throw new NotFoundError('Reservation not found');
    }

    // Format "kiedy" - day name
    const daysOfWeek = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const kiedy = daysOfWeek[fullRezerwacja.data.getDay()];

    const godzina = fullRezerwacja.godzinaOd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const usluga = fullRezerwacja.usluga?.nazwa || 'Usługa';
    const masazysta = fullRezerwacja.masazysta
      ? `${fullRezerwacja.masazysta.imie} ${fullRezerwacja.masazysta.nazwisko}`
      : 'Masaż';

    const template = renderSMSTemplate('PRZYPOMNIENIE', {
      kiedy,
      godzina,
      usluga,
      masazysta,
    });

    return this.wyslij(fullRezerwacja.klientId, template, 'PRZYPOMNIENIE', rezerwacja.id);
  }

  /**
   * Send package notification SMS
   */
  async wyslijPowiadomieniePakiet(
    pakiet: PakietKlienta & { klient?: { imie: string; nazwisko: string } },
    notificationType: 'KONCZY_SIE' | 'WYGASA'
  ): Promise<any> {
    // Fetch full package data if not provided
    const fullPakiet = pakiet.klient
      ? pakiet
      : await prisma.pakietKlienta.findUnique({
          where: { id: pakiet.id },
          include: {
            klient: { select: { imie: true, nazwisko: true } },
          },
        });

    if (!fullPakiet) {
      throw new NotFoundError('Package not found');
    }

    let templateKey: string;
    let context: Record<string, string | number>;

    if (notificationType === 'KONCZY_SIE') {
      templateKey = 'PAKIET_KONCZY_SIE';
      context = {
        godziny: fullPakiet.godzinyPozostale,
      };
    } else {
      templateKey = 'PAKIET_WYGASA';
      const data = fullPakiet.dataWaznosci.toLocaleDateString('pl-PL');
      context = {
        data,
        godziny: fullPakiet.godzinyPozostale,
      };
    }

    const template = renderSMSTemplate(templateKey, context);

    return this.wyslij(fullPakiet.klientId, template, 'PAKIET');
  }

  /**
   * Get SMS logs with filters
   */
  async getLogi(filters: { klientId?: string; rezerwacjaId?: string; typ?: string; page?: number; limit?: number }) {
    const where: any = {};

    if (filters.klientId) {
      where.klientId = filters.klientId;
    }
    if (filters.rezerwacjaId) {
      where.rezerwacjaId = filters.rezerwacjaId;
    }
    if (filters.typ) {
      where.typ = filters.typ;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [logi, total] = await Promise.all([
      prisma.sMSLog.findMany({
        where,
        include: {
          klient: {
            select: {
              imie: true,
              nazwisko: true,
              telefon: true,
            },
          },
          rezerwacja: {
            select: {
              numer: true,
              data: true,
            },
          },
        },
        orderBy: { dataWyslania: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sMSLog.count({ where }),
    ]);

    return {
      data: logi,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get failed SMS logs for retry
   */
  async getFailedSMS() {
    return prisma.sMSLog.findMany({
      where: {
        status: 'BLAD',
      },
      include: {
        klient: {
          select: {
            telefon: true,
          },
        },
      },
      orderBy: { dataWyslania: 'asc' },
      take: 50,
    });
  }

  /**
   * Retry sending failed SMS
   */
  async retrySendFailed(smsLogId: string): Promise<any> {
    const smsLog = await prisma.sMSLog.findUnique({
      where: { id: smsLogId },
      include: {
        klient: {
          select: {
            telefon: true,
          },
        },
      },
    });

    if (!smsLog) {
      throw new NotFoundError('SMS log not found');
    }

    if (!smsLog.klient) {
      throw new NotFoundError('Client not found for this SMS log');
    }

    let status: string = 'WYSLANY';
    let bladOpis: string | null = null;

    try {
      // Try to send again
      await smsProvider.send(smsLog.klient.telefon, smsLog.tresc);
      status = 'WYSLANY';
    } catch (error) {
      status = 'BLAD';
      bladOpis = error instanceof Error ? error.message : 'Unknown error';
    }

    // Update log
    return prisma.sMSLog.update({
      where: { id: smsLogId },
      data: {
        status,
        bladOpis,
      },
    });
  }
}

export const smsService = new SMSService();
