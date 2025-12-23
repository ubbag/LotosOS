import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError, ConflictError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { CreateRezerwacjaOnlineRequest, CreateVoucherOnlineRequest } from './public.schemas';
import { getDostepneSloty } from '../rezerwacje/rezerwacje.utils';
import { generujKod } from '../vouchery/vouchery.utils';
import { createPaymentSession, verifyWebhookSignature } from './public.payment';
import { smsService } from '../sms/sms.service';

export class PublicService {
  /**
   * Get all active services with variants and add-ons
   */
  async getUslugi() {
    const uslugi = await prisma.usluga.findMany({
      where: { aktywna: true },
      include: {
        wariantyUslugi: {
          orderBy: { czasMinut: 'asc' },
        },
      },
      orderBy: { kolejnosc: 'asc' },
    });

    return uslugi.map((u) => ({
      id: u.id,
      nazwa: u.nazwa,
      kategoria: u.kategoria,
      opis: u.opis,
      warianty: u.wariantyUslugi.map((w) => ({
        id: w.id,
        czasMinut: w.czasMinut,
        cenaRegularna: parseFloat(w.cenaRegularna.toString()),
        cenaPromocyjna: w.cenaPromocyjna ? parseFloat(w.cenaPromocyjna.toString()) : null,
      })),
    }));
  }

  /**
   * Get all active therapists
   */
  async getMasazysci() {
    const masazysci = await prisma.masazysta.findMany({
      where: { aktywny: true },
      select: {
        id: true,
        imie: true,
        nazwisko: true,
        specjalizacje: true,
        jezyki: true,
        zdjecieUrl: true,
      },
      orderBy: { kolejnosc: 'asc' },
    });

    return masazysci;
  }

  /**
   * Get available time slots for booking
   */
  async getDostepneGodziny(data: Date, wariantId: string, masazystaId?: string) {
    return getDostepneSloty(data, wariantId, masazystaId);
  }

  /**
   * Create reservation from online form
   */
  async createRezerwacjaOnline(data: CreateRezerwacjaOnlineRequest) {
    // Find or create client
    const existingClient = await prisma.klient.findUnique({
      where: { telefon: data.klient.telefon },
    });

    let klientId: string;
    if (existingClient) {
      klientId = existingClient.id;
      // Update email if provided and different
      if (data.klient.email && data.klient.email !== existingClient.email) {
        await prisma.klient.update({
          where: { id: existingClient.id },
          data: { email: data.klient.email },
        });
      }
    } else {
      // Create new client
      const newClient = await prisma.klient.create({
        data: {
          imie: data.klient.imie,
          nazwisko: data.klient.nazwisko,
          telefon: data.klient.telefon,
          email: data.klient.email,
          zrodlo: 'ONLINE',
          aktywny: true,
        },
      });
      klientId = newClient.id;
    }

    // Get service variant for pricing
    const variant = await prisma.wariantUslugi.findUnique({
      where: { id: data.wariantId },
      include: { usluga: { select: { id: true, nazwa: true } } },
    });

    if (!variant) {
      throw new NotFoundError('Service variant not found');
    }

    // Calculate total price
    const basePrice = variant.cenaPromocyjna || variant.cenaRegularna;
    let doplatyPrice = 0;

    if (data.doplaty && data.doplaty.length > 0) {
      const doplaty = await prisma.doplata.findMany({
        where: { id: { in: data.doplaty } },
      });
      doplatyPrice = doplaty.reduce((sum, d) => sum + d.cena, 0);
    }

    const totalPrice = basePrice + doplatyPrice;

    // If online payment required, return payment link instead of creating reservation
    if (data.platnoscOnline) {
      const paymentSession = await createPaymentSession('rezerwacja', {
        klientId,
        wariantId: data.wariantId,
        data: data.data,
        godzina: data.godzina,
        masazystaId: data.masazystaId,
        doplaty: data.doplaty,
      }, totalPrice);

      return {
        success: false,
        requiresPayment: true,
        paymentUrl: paymentSession.paymentUrl,
        sessionId: paymentSession.sessionId,
        message: 'Redirect to payment gateway',
      };
    }

    // Create reservation directly (for cash payment)
    return this.createRezerwacjaFromPayment({
      klientId,
      wariantId: data.wariantId,
      data: data.data,
      godzina: data.godzina,
      masazystaId: data.masazystaId,
      doplaty: data.doplaty,
    });
  }

  /**
   * Create voucher from online form
   */
  async createVoucherOnline(data: CreateVoucherOnlineRequest) {
    // Find or create buyer client
    const buyerClient = await prisma.klient.findUnique({
      where: { telefon: data.kupujacy.telefon },
    });

    let kupujacyId: string;
    if (!buyerClient) {
      const newBuyer = await prisma.klient.create({
        data: {
          imie: data.kupujacy.imie,
          nazwisko: data.kupujacy.nazwisko,
          telefon: data.kupujacy.telefon,
          email: data.kupujacy.email,
          zrodlo: 'ONLINE',
          aktywny: true,
        },
      });
      kupujacyId = newBuyer.id;
    } else {
      kupujacyId = buyerClient.id;
    }

    // Calculate voucher value
    let wartosc: number;
    let uslugaId: string | null = null;

    if (data.typ === 'KWOTOWY') {
      wartosc = parseFloat((data.wartosc || 0).toString());
    } else {
      // USLUGOWY
      const usluga = await prisma.usluga.findUnique({
        where: { id: data.uslugaId },
        include: { wariantyUslugi: { orderBy: { czasMinut: 'asc' }, take: 1 } },
      });

      if (!usluga) {
        throw new NotFoundError('Service not found');
      }

      wartosc = usluga.wariantyUslugi[0]?.cenaRegularna || 0;
      uslugaId = data.uslugaId || null;
    }

    // If online payment required, return payment link
    if (data.platnoscOnline) {
      const paymentSession = await createPaymentSession('voucher', {
        typ: data.typ,
        wartosc: wartosc.toString(),
        kupujacyId,
        obdarowanyImie: data.obdarowany.imie,
        obdarowanyEmail: data.obdarowany.email,
        wiadomosc: data.wiadomosc,
        uslugaId,
      }, wartosc);

      return {
        success: false,
        requiresPayment: true,
        paymentUrl: paymentSession.paymentUrl,
        sessionId: paymentSession.sessionId,
        message: 'Redirect to payment gateway',
      };
    }

    // Create voucher directly (would be unusual)
    return this.createVoucherFromPayment({
      typ: data.typ,
      wartosc,
      kupujacyId,
      obdarowanyImie: data.obdarowany.imie,
      obdarowanyEmail: data.obdarowany.email,
      wiadomosc: data.wiadomosc,
      uslugaId,
    });
  }

  /**
   * Handle payment webhook
   */
  async handlePlatnoscWebhook(payload: any, signature: string): Promise<{ success: boolean; message: string }> {
    // Verify webhook signature
    const payloadStr = JSON.stringify(payload);
    if (!verifyWebhookSignature(payloadStr, signature)) {
      throw new ConflictError('Invalid webhook signature');
    }

    const { sessionId, status, type, data } = payload;

    if (status !== 'success') {
      // Payment failed or cancelled
      console.error(`[Webhook] Payment failed: ${sessionId}`);
      return {
        success: false,
        message: 'Payment was not successful',
      };
    }

    try {
      if (type === 'rezerwacja') {
        return await this.createRezerwacjaFromPayment(data);
      } else if (type === 'voucher') {
        return await this.createVoucherFromPayment(data);
      }
      return {
        success: false,
        message: 'Unknown payment type',
      };
    } catch (error) {
      console.error(`[Webhook] Error processing payment: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Get or create system user ID
   */
  private async getSystemUserId(): Promise<string> {
    const systemUser = await prisma.user.findUnique({
      where: { email: 'system@lotosspa.internal' },
      select: { id: true },
    });

    if (!systemUser) {
      // Fallback: create system user if not exists
      const created = await prisma.user.create({
        data: {
          email: 'system@lotosspa.internal',
          passwordHash: await import('bcrypt').then(b => b.hash(Math.random().toString(36), 10)),
          imie: 'System',
          rola: 'WLASCICIEL',
          aktywny: false,
        },
      });
      return created.id;
    }

    return systemUser.id;
  }

  /**
   * Internal: Create reservation after payment confirmed
   */
  private async createRezerwacjaFromPayment(data: any) {
    const { klientId, wariantId, data: rezDate, godzina, masazystaId, doplaty } = data;

    // Get variant
    const variant = await prisma.wariantUslugi.findUnique({
      where: { id: wariantId },
    });

    if (!variant) {
      throw new NotFoundError('Service variant not found');
    }

    // Calculate end time
    const godzinaOd = new Date(godzina);
    const godzinaDo = new Date(godzinaOd);
    godzinaDo.setMinutes(godzinaDo.getMinutes() + variant.czasMinut);

    // Find available therapist if not specified
    let finalMasazystaId = masazystaId;
    if (!finalMasazystaId) {
      const slot = await getDostepneSloty(new Date(rezDate), wariantId);
      if (slot.length === 0) {
        throw new ConflictError('No available time slots');
      }
      finalMasazystaId = slot[0].masazystaId;
    }

    // Find available room
    const availableRoom = await prisma.gabinet.findFirst({
      where: { aktywny: true },
    });

    if (!availableRoom) {
      throw new ConflictError('No available rooms');
    }

    // Generate reservation number (race-condition safe)
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const numer = `R-${year}-${timestamp}${random}`;

    // Calculate price
    const basePrice = variant.cenaPromocyjna || variant.cenaRegularna;
    let doplatyPrice = 0;

    if (doplaty && doplaty.length > 0) {
      const doplatyList = await prisma.doplata.findMany({
        where: { id: { in: doplaty } },
      });
      doplatyPrice = doplatyList.reduce((sum, d) => sum + d.cena, 0);
    }

    const cenaCalokowita = basePrice + doplatyPrice;

    // Get system user ID
    const systemUserId = await this.getSystemUserId();

    // Create reservation
    const rezerwacja = await prisma.rezerwacja.create({
      data: {
        numer,
        klientId,
        masazystaId: finalMasazystaId,
        gabinetId: availableRoom.id,
        uslugaId: variant.uslugaId,
        wariantId,
        data: new Date(rezDate),
        godzinaOd,
        godzinaDo,
        cenaCalokowita,
        status: 'POTWIERDZONA',
        zrodlo: 'ONLINE',
        platnoscMetoda: 'PRZELEW',
        platnoscStatus: 'OPLACONA',
        createdById: systemUserId,
      },
      include: {
        usluga: { select: { nazwa: true } },
        masazysta: { select: { imie: true, nazwisko: true } },
      },
    });

    // Send confirmation SMS
    try {
      await smsService.wyslijPotwierdzenie(rezerwacja as any);
    } catch (error) {
      console.error('Failed to send confirmation SMS:', error);
    }

    return {
      success: true,
      message: 'Reservation created successfully',
      data: {
        rezerwacjaId: rezerwacja.id,
        numer: rezerwacja.numer,
        data: rezerwacja.data,
      },
    };
  }

  /**
   * Internal: Create voucher after payment confirmed
   */
  private async createVoucherFromPayment(data: any) {
    const { typ, wartosc, kupujacyId, obdarowanyImie, obdarowanyEmail, wiadomosc, uslugaId } = data;

    const kod = await generujKod();
    const wartoscDecimal = new Decimal(wartosc);
    const dataWaznosci = new Date();
    dataWaznosci.setDate(dataWaznosci.getDate() + 365);

    // Get buyer info (single query)
    const kupujacyInfo = await this.getKupujacyInfo(kupujacyId);

    const voucher = await prisma.voucher.create({
      data: {
        kod,
        typ,
        wartoscPoczatkowa: parseFloat(wartoscDecimal.toString()),
        wartoscPozostala: parseFloat(wartoscDecimal.toString()),
        uslugaId: uslugaId || null,
        kupujacyImie: kupujacyInfo.imie,
        kupujacyEmail: kupujacyInfo.email,
        obdarowanyImie,
        obdarowanyEmail,
        wiadomosc,
        dataZakupu: new Date(),
        dataWaznosci,
        status: 'AKTYWNY',
        zrodlo: 'ONLINE',
      },
    });

    // Send email to recipient with voucher code
    // In production: send PDF with gift message
    console.log(`[Public] Voucher created: ${kod} for ${obdarowanyImie} (${obdarowanyEmail})`);

    return {
      success: true,
      message: 'Voucher created and sent to recipient',
      data: {
        voucherId: voucher.id,
        kod: voucher.kod,
      },
    };
  }

  /**
   * Get buyer info - single database query
   */
  private async getKupujacyInfo(kupujacyId: string | undefined): Promise<{ imie: string; email: string }> {
    if (!kupujacyId) {
      return { imie: 'Guest', email: '' };
    }

    try {
      const klient = await prisma.klient.findUnique({
        where: { id: kupujacyId },
        select: { imie: true, email: true },
      });

      return {
        imie: klient?.imie || 'Guest',
        email: klient?.email || '',
      };
    } catch {
      return { imie: 'Guest', email: '' };
    }
  }
}

export const publicService = new PublicService();
