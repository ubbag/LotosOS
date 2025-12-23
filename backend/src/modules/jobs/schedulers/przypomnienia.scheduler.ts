import { CronJob } from 'cron';
import { prisma } from '../../../shared/prisma';
import { addSMSJob } from '../queue';

/**
 * Reminder Scheduler
 * Sends SMS reminders to clients about upcoming reservations
 * Runs daily at 10:00 AM
 *
 * Logic:
 * - Monday: remind about Tuesday reservations
 * - Tuesday: remind about Wednesday reservations
 * - Wednesday: remind about Thursday reservations
 * - Thursday: remind about Friday and Saturday reservations
 * - Friday: remind about Sunday reservations
 * - Saturday: no reminders
 * - Sunday: remind about Monday reservations
 */

export function getNextDaysForReminder(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  const nextDays: Date[] = [];

  switch (dayOfWeek) {
    case 1: // Monday - remind about Tuesday
      nextDays.push(getDateForDay(2)); // Tuesday
      break;
    case 2: // Tuesday - remind about Wednesday
      nextDays.push(getDateForDay(3)); // Wednesday
      break;
    case 3: // Wednesday - remind about Thursday
      nextDays.push(getDateForDay(4)); // Thursday
      break;
    case 4: // Thursday - remind about Friday and Saturday
      nextDays.push(getDateForDay(5)); // Friday
      nextDays.push(getDateForDay(6)); // Saturday
      break;
    case 5: // Friday - remind about Sunday
      nextDays.push(getDateForDay(0)); // Sunday (next week)
      break;
    case 6: // Saturday - no reminders
      return [];
    case 0: // Sunday - remind about Monday
      nextDays.push(getDateForDay(1)); // Monday
      break;
  }

  return nextDays;
}

/**
 * Get date for a specific day of week (0-6)
 */
function getDateForDay(targetDay: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const targetDate = new Date(today);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  targetDate.setHours(0, 0, 0, 0); // Set to start of day

  return targetDate;
}

/**
 * Send reminders for upcoming reservations
 */
export async function sendReminders() {
  console.log('[Reminder Scheduler] Starting reminder job at', new Date().toISOString());

  try {
    const nextDays = getNextDaysForReminder();

    if (nextDays.length === 0) {
      console.log('[Reminder Scheduler] No reminders to send today (Saturday)');
      return;
    }

    for (const reminderDate of nextDays) {
      const dateEnd = new Date(reminderDate);
      dateEnd.setDate(dateEnd.getDate() + 1);

      // Find all reservations for this date
      const rezerwacje = await prisma.rezerwacja.findMany({
        where: {
          data: {
            gte: reminderDate,
            lt: dateEnd,
          },
          status: { in: ['POTWIERDZONA'] },
        },
        include: {
          klient: true,
          masazysta: true,
          usluga: true,
        },
      });

      console.log(`[Reminder Scheduler] Found ${rezerwacje.length} reservations for ${reminderDate.toDateString()}`);

      // Add SMS job for each reservation
      for (const rez of rezerwacje) {
        if (!rez.klient.telefon) {
          console.log(`[Reminder Scheduler] Skipping reminder for reservation ${rez.id} - no phone number`);
          continue;
        }

        const godzina = rez.godzinaOd.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const data = rez.data.toLocaleDateString('pl-PL');

        const wiadomosc = `Przypomnienie: masz zaplanowany ${rez.usluga?.nazwa || 'masaż'} dnia ${data} o ${godzina}. Potwierdzenia dokonaj poprzez portal lub SMS.`;

        try {
          await addSMSJob({
            telefon: rez.klient.telefon,
            wiadomosc,
            rezerwacjaId: rez.id,
            typ: 'PRZYPOMNIENIE',
          });

          console.log(`[Reminder Scheduler] SMS reminder added for reservation ${rez.id}`);
        } catch (error) {
          console.error(`[Reminder Scheduler] Error adding SMS job for ${rez.id}:`, error);
        }
      }
    }

    console.log('[Reminder Scheduler] Reminder job completed');
  } catch (error) {
    console.error('[Reminder Scheduler] Error in reminder job:', error);
    throw error;
  }
}

/**
 * Create and start reminder scheduler
 */
export function createReminderScheduler(): CronJob {
  // Runs daily at 10:00 AM (0 10 * * *)
  const job = new CronJob('0 10 * * *', sendReminders, null, false, 'Europe/Warsaw');

  return job;
}

/**
 * Register reminder scheduler
 */
export async function registerReminderScheduler() {
  const job = createReminderScheduler();
  job.start();

  console.log('[Reminder Scheduler] Registered - runs daily at 10:00 AM');

  return job;
}
