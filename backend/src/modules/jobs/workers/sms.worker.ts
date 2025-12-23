import { Job } from 'bull';
import { SMSJobData, smsQueue } from '../queue';
import { smsProvider } from '../../sms/sms.provider';
import { prisma } from '../../../shared/prisma';

/**
 * SMS Worker - Processes SMS jobs from queue
 * Sends SMS directly to phone numbers (used for notifications and reminders)
 */

export async function processSMSJob(job: Job<SMSJobData>) {
  const { telefon, wiadomosc, typ, rezerwacjaId } = job.data;

  try {
    console.log(`[SMS Worker] Processing job ${job.id}: sending ${typ} to ${telefon}`);

    // Validate phone number
    if (!telefon || !wiadomosc) {
      throw new Error('Missing telefon or wiadomosc in job data');
    }

    // Send SMS through provider
    let status: 'WYSLANY' | 'BLAD' | 'DOSTARCZONY' = 'WYSLANY';
    let bladOpis: string | null = null;

    try {
      const result = await smsProvider.send(telefon, wiadomosc);
      status = result.status as 'WYSLANY' | 'BLAD' | 'DOSTARCZONY';
    } catch (error) {
      status = 'BLAD';
      bladOpis = error instanceof Error ? error.message : 'Unknown SMS provider error';
      console.error(`[SMS Worker] SMS Provider error for job ${job.id}:`, error);
      throw new Error(bladOpis);
    }

    // Log SMS attempt to database (only if rezerwacjaId provided - meaning it's linked to a reservation)
    if (rezerwacjaId) {
      try {
        // Find the klient associated with this reservation
        const rezerwacja = await prisma.rezerwacja.findUnique({
          where: { id: rezerwacjaId },
          select: { klientId: true },
        });

        if (rezerwacja) {
          await prisma.sMSLog.create({
            data: {
              klientId: rezerwacja.klientId,
              rezerwacjaId,
              typ,
              tresc: wiadomosc,
              status,
              bladOpis,
            },
          });
        }
      } catch (dbError) {
        console.warn(`[SMS Worker] Failed to log SMS to database:`, dbError);
        // Don't throw - logging failure shouldn't fail the job
      }
    }

    console.log(`[SMS Worker] SMS processed successfully for job ${job.id}`);

    return {
      success: true,
      status,
      message: 'SMS processed',
    };
  } catch (error) {
    console.error(`[SMS Worker] Error processing job ${job.id}:`, error);
    // Throw to trigger Bull retry logic
    throw error;
  }
}

/**
 * Register SMS worker
 */
export async function registerSMSWorker() {
  // Process jobs with concurrency of 2 SMS sends at a time
  smsQueue.process(2, processSMSJob);

  console.log('[SMS Worker] Registered and listening for jobs');

  return smsQueue;
}
