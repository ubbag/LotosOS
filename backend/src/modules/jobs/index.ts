import { CronJob } from 'cron';
import { registerSMSWorker } from './workers/sms.worker';
import { registerEmailWorker } from './workers/email.worker';
import { registerReminderScheduler } from './schedulers/przypomnienia.scheduler';
import { registerPackageSchedulers } from './schedulers/pakiety.scheduler';
import { closeQueues, smsQueue, emailQueue, reportQueue } from './queue';

/**
 * Jobs Module
 * Manages all background job processing and scheduled tasks
 */

interface JobsInstance {
  queues: {
    sms: typeof smsQueue;
    email: typeof emailQueue;
    report: typeof reportQueue;
  };
  schedulers: {
    reminders: CronJob;
    packageDaily: CronJob;
    packageWeekly: CronJob;
  };
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

let jobsInstance: JobsInstance | null = null;

/**
 * Initialize all workers and schedulers
 */
export async function initializeJobs(): Promise<JobsInstance | null> {
  console.log('[Jobs] Initializing background job system...');

  try {
    // Register workers
    console.log('[Jobs] Starting workers...');
    const smsQueue = await registerSMSWorker();
    const emailQueue = await registerEmailWorker();

    // Register schedulers
    console.log('[Jobs] Starting schedulers...');
    const reminderScheduler = await registerReminderScheduler();
    const { dailyJob, weeklyJob } = await registerPackageSchedulers();

    jobsInstance = {
      queues: {
        sms: smsQueue,
        email: emailQueue,
        report: reportQueue,
      },
      schedulers: {
        reminders: reminderScheduler,
        packageDaily: dailyJob,
        packageWeekly: weeklyJob,
      },
      start: async () => {
        console.log('[Jobs] Starting all job processors...');
        reminderScheduler.start();
        dailyJob.start();
        weeklyJob.start();
      },
      stop: async () => {
        console.log('[Jobs] Stopping all job processors...');
        reminderScheduler.stop();
        dailyJob.stop();
        weeklyJob.stop();
        await closeQueues();
      },
    };

    console.log('[Jobs] ✓ Job system initialized successfully');
    return jobsInstance;
  } catch (error) {
    console.error('[Jobs] Failed to initialize job system:', error);
    throw error;
  }
}

/**
 * Get jobs instance (returns null if not initialized)
 */
export function getJobsInstance(): JobsInstance | null {
  return jobsInstance;
}

/**
 * Check if jobs instance is initialized
 */
export function isJobsInitialized(): boolean {
  return jobsInstance !== null;
}

/**
 * Start job system (usually called during application startup)
 */
export async function startJobs() {
  if (!jobsInstance) {
    throw new Error('Jobs not initialized. Call initializeJobs() first.');
  }

  await jobsInstance.start();
}

/**
 * Stop job system gracefully (for shutdown)
 */
export async function stopJobs() {
  if (!jobsInstance) {
    return;
  }

  await jobsInstance.stop();
}

/**
 * Graceful shutdown handler
 */
export async function setupGracefulShutdown() {
  process.on('SIGINT', async () => {
    console.log('\n[Jobs] Received SIGINT, shutting down gracefully...');
    await stopJobs();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n[Jobs] Received SIGTERM, shutting down gracefully...');
    await stopJobs();
    process.exit(0);
  });
}

/**
 * Export queue helpers for use throughout the application
 */
export { addSMSJob, addEmailJob, addReportJob } from './queue';
export { SMSJobData, EmailJobData, ReportJobData } from './queue';

/**
 * Export worker and scheduler functions for testing/manual runs
 */
export { processSMSJob } from './workers/sms.worker';
export { processEmailJob } from './workers/email.worker';
export { sendReminders, getNextDaysForReminder } from './schedulers/przypomnienia.scheduler';
export { updateExpiredStatuses, notifyExpiringPackages } from './schedulers/pakiety.scheduler';
