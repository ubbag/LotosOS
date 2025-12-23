import { prisma } from '../../shared/prisma';
import { smsService } from './sms.service';

/**
 * Send reminders for tomorrow's reservations
 * Run daily at 10:00
 */
export async function sendReminders(): Promise<void> {
  console.log('[SMS Job] Starting reminder job...');

  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Find all confirmed and in-progress reservations for tomorrow
    const rezerwacje = await prisma.rezerwacja.findMany({
      where: {
        data: {
          gte: tomorrow,
          lte: tomorrowEnd,
        },
        status: {
          in: ['POTWIERDZONA', 'W TRAKCIE'],
        },
      },
      include: {
        usluga: { select: { nazwa: true } },
        masazysta: { select: { imie: true, nazwisko: true } },
      },
    });

    console.log(`[SMS Job] Found ${rezerwacje.length} reservations for tomorrow`);

    let sent = 0;
    let failed = 0;

    for (const rez of rezerwacje) {
      try {
        await smsService.wyslijPrzypomnienie(rez);
        sent++;
      } catch (error) {
        failed++;
        console.error(`[SMS Job] Failed to send reminder for reservation ${rez.id}:`, error);
      }
    }

    console.log(`[SMS Job] Reminders sent: ${sent}, failed: ${failed}`);
  } catch (error) {
    console.error('[SMS Job] Reminder job error:', error);
  }
}

/**
 * Send package notifications
 * Run weekly (e.g., every Monday at 09:00)
 */
export async function sendPackageNotifications(): Promise<void> {
  console.log('[SMS Job] Starting package notifications job...');

  try {
    // Find packages ending soon (< 2 hours remaining)
    const packagesEndingSoon = await prisma.pakietKlienta.findMany({
      where: {
        status: 'AKTYWNY',
        godzinyPozostale: {
          lt: 2,
        },
      },
      include: {
        klient: { select: { imie: true, nazwisko: true } },
      },
    });

    console.log(`[SMS Job] Found ${packagesEndingSoon.length} packages ending soon`);

    let sent = 0;

    for (const pakiet of packagesEndingSoon) {
      try {
        // Check if notification was already sent recently
        const recentLog = await prisma.sMSLog.findFirst({
          where: {
            klientId: pakiet.klientId,
            typ: 'PAKIET',
            dataWyslania: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        });

        if (!recentLog) {
          await smsService.wyslijPowiadomieniePakiet(pakiet, 'KONCZY_SIE');
          sent++;
        }
      } catch (error) {
        console.error(`[SMS Job] Failed to send package notification for package ${pakiet.id}:`, error);
      }
    }

    console.log(`[SMS Job] Package ending notifications sent: ${sent}`);

    // Find packages expiring soon (< 30 days)
    const packagesExpiringSoon = await prisma.pakietKlienta.findMany({
      where: {
        status: 'AKTYWNY',
        dataWaznosci: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        klient: { select: { imie: true, nazwisko: true } },
      },
    });

    console.log(`[SMS Job] Found ${packagesExpiringSoon.length} packages expiring soon`);

    let expiredSent = 0;

    for (const pakiet of packagesExpiringSoon) {
      try {
        // Check if notification was already sent recently
        const recentLog = await prisma.sMSLog.findFirst({
          where: {
            klientId: pakiet.klientId,
            typ: 'PAKIET',
            dataWyslania: {
              gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
            },
          },
        });

        if (!recentLog) {
          await smsService.wyslijPowiadomieniePakiet(pakiet, 'WYGASA');
          expiredSent++;
        }
      } catch (error) {
        console.error(`[SMS Job] Failed to send expiration notification for package ${pakiet.id}:`, error);
      }
    }

    console.log(`[SMS Job] Package expiration notifications sent: ${expiredSent}`);
  } catch (error) {
    console.error('[SMS Job] Package notifications job error:', error);
  }
}

/**
 * Retry sending failed SMS
 * Run every hour
 */
export async function retryFailedSMS(): Promise<void> {
  console.log('[SMS Job] Starting retry failed SMS job...');

  try {
    const failedLogs = await smsService.getFailedSMS();

    console.log(`[SMS Job] Found ${failedLogs.length} failed SMS to retry`);

    let succeeded = 0;
    let stillFailed = 0;

    for (const log of failedLogs) {
      try {
        await smsService.retrySendFailed(log.id);
        succeeded++;
      } catch (error) {
        stillFailed++;
        console.error(`[SMS Job] Failed to retry SMS ${log.id}:`, error);
      }
    }

    console.log(`[SMS Job] Retries succeeded: ${succeeded}, still failed: ${stillFailed}`);
  } catch (error) {
    console.error('[SMS Job] Retry job error:', error);
  }
}
