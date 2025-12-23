import Queue, { Queue as QueueType } from 'bull';
import { env } from '../../config/env';

/**
 * Job Queue Configuration
 * Uses Bull with Redis for processing background jobs
 */

export interface SMSJobData {
  telefon: string;
  wiadomosc: string;
  rezerwacjaId?: string;
  voucherId?: string;
  typ: 'POTWIERDZENIE' | 'PRZYPOMNIENIE' | 'PAKIET' | 'MARKETING';
}

export interface EmailJobData {
  email: string;
  temat: string;
  szablon: string;
  zmienne: Record<string, any>;
  typ: 'potwierdzenie' | 'voucher' | 'informacja';
  pdfUrl?: string;
}

export interface ReportJobData {
  typ: 'dzienny' | 'tygodniowy' | 'mieseczny';
  data?: Date;
  recipientEmail?: string;
}

// Create queues
export const smsQueue: QueueType<SMSJobData> = new Queue('sms', {
  redis: {
    host: new URL(env.redisUrl).hostname || 'localhost',
    port: parseInt(new URL(env.redisUrl).port || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const emailQueue: QueueType<EmailJobData> = new Queue('email', {
  redis: {
    host: new URL(env.redisUrl).hostname || 'localhost',
    port: parseInt(new URL(env.redisUrl).port || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const reportQueue: QueueType<ReportJobData> = new Queue('report', {
  redis: {
    host: new URL(env.redisUrl).hostname || 'localhost',
    port: parseInt(new URL(env.redisUrl).port || '6379'),
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Event handlers for queues
 */

// SMS Queue events
smsQueue.on('active', (job) => {
  console.log(`[SMS Queue] Processing job ${job.id}: ${job.data.typ} to ${job.data.telefon}`);
});

smsQueue.on('completed', (job) => {
  console.log(`[SMS Queue] Completed job ${job.id}`);
});

smsQueue.on('failed', (job, err) => {
  console.error(`[SMS Queue] Failed job ${job.id}:`, err.message);
});

// Email Queue events
emailQueue.on('active', (job) => {
  console.log(`[Email Queue] Processing job ${job.id}: ${job.data.typ} to ${job.data.email}`);
});

emailQueue.on('completed', (job) => {
  console.log(`[Email Queue] Completed job ${job.id}`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`[Email Queue] Failed job ${job.id}:`, err.message);
});

// Report Queue events
reportQueue.on('active', (job) => {
  console.log(`[Report Queue] Processing job ${job.id}: ${job.data.typ}`);
});

reportQueue.on('completed', (job) => {
  console.log(`[Report Queue] Completed job ${job.id}`);
});

reportQueue.on('failed', (job, err) => {
  console.error(`[Report Queue] Failed job ${job.id}:`, err.message);
});

/**
 * Helper functions to add jobs to queues
 */

export async function addSMSJob(data: SMSJobData, delay?: number) {
  return smsQueue.add(data, {
    delay,
    jobId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });
}

export async function addEmailJob(data: EmailJobData, delay?: number) {
  return emailQueue.add(data, {
    delay,
    jobId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });
}

export async function addReportJob(data: ReportJobData, delay?: number) {
  return reportQueue.add(data, {
    delay,
    jobId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });
}

/**
 * Cleanup function for graceful shutdown
 */
export async function closeQueues() {
  await Promise.all([
    smsQueue.close(),
    emailQueue.close(),
    reportQueue.close(),
  ]);
}
