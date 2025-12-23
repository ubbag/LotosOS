import { CronJob } from 'cron';
import { prisma } from '../../../shared/prisma';
import { addSMSJob, addEmailJob } from '../queue';

/**
 * Package/Voucher Expiration Scheduler
 * Two daily tasks:
 * 1. Daily at 6:00 AM: Update statuses of expired packages and vouchers
 * 2. Weekly on Monday at 10:00 AM: Find expiring packages/vouchers and send notifications
 */

/**
 * Daily task: Update expired packages and vouchers to inactive
 */
export async function updateExpiredStatuses() {
  console.log('[Package Scheduler] Starting daily status update at', new Date().toISOString());

  try {
    const now = new Date();

    // Update expired packages
    const expiredPackages = await prisma.pakietKlienta.updateMany({
      where: {
        dataWaznosci: {
          lt: now,
        },
        status: 'AKTYWNY',
      },
      data: {
        status: 'WYGASLY',
      },
    });

    console.log(`[Package Scheduler] Updated ${expiredPackages.count} expired packages`);

    // Update expired vouchers
    const expiredVouchers = await prisma.voucher.updateMany({
      where: {
        dataWaznosci: {
          lt: now,
        },
        status: 'AKTYWNY',
      },
      data: {
        status: 'WYGASLY',
      },
    });

    console.log(`[Package Scheduler] Updated ${expiredVouchers.count} expired vouchers`);

    return {
      packagesUpdated: expiredPackages.count,
      vouchersUpdated: expiredVouchers.count,
    };
  } catch (error) {
    console.error('[Package Scheduler] Error updating expired statuses:', error);
    throw error;
  }
}

/**
 * Weekly task: Send notifications about soon-to-expire packages/vouchers
 */
export async function notifyExpiringPackages() {
  console.log('[Package Scheduler] Starting expiration notification job at', new Date().toISOString());

  try {
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Find packages expiring within next 7 days
    const expiringPackages = await prisma.pakietKlienta.findMany({
      where: {
        dataWaznosci: {
          gte: now,
          lte: weekFromNow,
        },
        status: 'AKTYWNY',
      },
      include: {
        klient: true,
        pakiet: true,
      },
    });

    console.log(`[Package Scheduler] Found ${expiringPackages.length} expiring packages`);

    // Send SMS for each expiring package
    for (const pakiet of expiringPackages) {
      if (!pakiet.klient.telefon) {
        console.log(`[Package Scheduler] Skipping notification for package ${pakiet.id} - no phone number`);
        continue;
      }

      const daysLeft = Math.ceil((pakiet.dataWaznosci.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const wiadomosc = `Twój pakiet "${pakiet.pakiet.nazwa}" wygasa za ${daysLeft} dni (${pakiet.dataWaznosci.toLocaleDateString('pl-PL')}). Aby go wykorzystać, zarezerwuj usługę.`;

      try {
        await addSMSJob({
          telefon: pakiet.klient.telefon,
          wiadomosc,
          typ: 'PAKIET',
        });

        console.log(`[Package Scheduler] Expiration notification added for package ${pakiet.id}`);
      } catch (error) {
        console.error(`[Package Scheduler] Error adding SMS for package ${pakiet.id}:`, error);
      }
    }

    // Find vouchers expiring within next 7 days
    const expiringVouchers = await prisma.voucher.findMany({
      where: {
        dataWaznosci: {
          gte: now,
          lte: weekFromNow,
        },
        status: 'AKTYWNY',
      },
    });

    console.log(`[Package Scheduler] Found ${expiringVouchers.length} expiring vouchers`);

    // Send notifications for each expiring voucher
    for (const voucher of expiringVouchers) {
      if (!voucher.obdarowanyEmail) {
        console.log(`[Package Scheduler] Skipping notification for voucher ${voucher.id} - no email`);
        continue;
      }

      const daysLeft = Math.ceil((voucher.dataWaznosci.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      try {
        await addEmailJob({
          email: voucher.obdarowanyEmail,
          temat: 'Voucher wygasa wkrótce',
          szablon: 'voucher_expires',
          zmienne: {
            kod: voucher.kod,
            wartosc: voucher.wartoscPoczatkowa.toString(),
            daysLeft,
            dataWaznosci: voucher.dataWaznosci.toLocaleDateString('pl-PL'),
          },
          typ: 'informacja',
        });

        console.log(`[Package Scheduler] Expiration notification added for voucher ${voucher.id}`);
      } catch (error) {
        console.error(`[Package Scheduler] Error processing voucher ${voucher.id}:`, error);
      }
    }

    console.log('[Package Scheduler] Expiration notification job completed');

    return {
      packagesNotified: expiringPackages.length,
      vouchersNotified: expiringVouchers.length,
    };
  } catch (error) {
    console.error('[Package Scheduler] Error in expiration notification job:', error);
    throw error;
  }
}

/**
 * Create daily status update scheduler
 * Runs at 6:00 AM every day
 */
export function createDailyStatusScheduler(): CronJob {
  const job = new CronJob('0 6 * * *', async () => {
    await updateExpiredStatuses();
  }, null, false, 'Europe/Warsaw');
  return job;
}

/**
 * Create weekly notification scheduler
 * Runs at 10:00 AM every Monday
 */
export function createWeeklyNotificationScheduler(): CronJob {
  const job = new CronJob('0 10 * * 1', async () => {
    await notifyExpiringPackages();
  }, null, false, 'Europe/Warsaw');
  return job;
}

/**
 * Register package schedulers
 */
export async function registerPackageSchedulers() {
  const dailyJob = createDailyStatusScheduler();
  const weeklyJob = createWeeklyNotificationScheduler();

  dailyJob.start();
  weeklyJob.start();

  console.log('[Package Scheduler] Daily status updater - runs at 6:00 AM');
  console.log('[Package Scheduler] Weekly notification job - runs Mondays at 10:00 AM');

  return { dailyJob, weeklyJob };
}
