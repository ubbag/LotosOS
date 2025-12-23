import { Job } from 'bull';
import nodemailer from 'nodemailer';
import { EmailJobData, emailQueue } from '../queue';
import { env } from '../../../config/env';

/**
 * Email Worker - Processes email jobs from queue
 * Supports confirmation emails, voucher PDFs, and notifications
 */

// Create email transporter
const transporter = nodemailer.createTransport({
  host: env.emailHost,
  port: env.emailPort,
  secure: env.emailPort === 465,
  auth: {
    user: env.emailUser,
    pass: env.emailPassword,
  },
});

/**
 * Email templates
 */
const emailTemplates: Record<string, (zmienne: Record<string, any>) => { subject: string; html: string }> = {
  potwierdzenie_rezerwacji: (zmienne) => ({
    subject: `Potwierdzenie rezerwacji - ${zmienne.numer}`,
    html: `
      <h2>Potwierdzenie rezerwacji</h2>
      <p>Dziękujemy za rezerwację!</p>
      <p><strong>Numer rezerwacji:</strong> ${zmienne.numer}</p>
      <p><strong>Data:</strong> ${zmienne.data}</p>
      <p><strong>Godzina:</strong> ${zmienne.godzina}</p>
      <p><strong>Usługa:</strong> ${zmienne.usluga}</p>
      <p><strong>Masażysta:</strong> ${zmienne.masazysta}</p>
      <p><strong>Cena:</strong> ${zmienne.cena} PLN</p>
      <hr />
      <p>Jeśli chcesz anulować rezerwację, skontaktuj się z nami.</p>
    `,
  }),
  voucher_zakupiony: (zmienne) => ({
    subject: `Twój voucher - ${zmienne.kod}`,
    html: `
      <h2>Voucher zakupiony!</h2>
      <p>Cześć ${zmienne.obdarowanyImie},</p>
      <p>${zmienne.kupujacyImie} kupił dla Ciebie voucher na usługę masażu!</p>
      <p><strong>Kod voucher'a:</strong> ${zmienne.kod}</p>
      <p><strong>Wartość:</strong> ${zmienne.wartosc} PLN</p>
      <p><strong>Ważny do:</strong> ${zmienne.dataWaznosci}</p>
      ${zmienne.wiadomosc ? `<p><strong>Wiadomość:</strong> "${zmienne.wiadomosc}"</p>` : ''}
      <p>Aby skorzystać z vouchera, wejdź na naszą stronę i dokonaj rezerwacji.</p>
    `,
  }),
  potwierdzenie_platnosci: (zmienne) => ({
    subject: 'Potwierdzenie płatności',
    html: `
      <h2>Płatność potwierdzona</h2>
      <p>Twoja płatność w wysokości ${zmienne.kwota} PLN została zakseptowana.</p>
      <p><strong>ID transakcji:</strong> ${zmienne.transactionId}</p>
      <p><strong>Data:</strong> ${zmienne.data}</p>
      <p>Dziękujemy!</p>
    `,
  }),
};

/**
 * Process email job
 */
export async function processEmailJob(job: Job<EmailJobData>) {
  const { email, temat, szablon, zmienne, typ, pdfUrl } = job.data;

  try {
    console.log(`[Email Worker] Processing job ${job.id}: ${typ} to ${email}`);

    // Get email template
    const templateFn = emailTemplates[szablon];
    if (!templateFn) {
      throw new Error(`Unknown email template: ${szablon}`);
    }

    const { subject, html } = templateFn(zmienne);

    // Prepare mail options
    const mailOptions: any = {
      from: env.emailUser,
      to: email,
      subject: subject || temat,
      html,
    };

    // Attach PDF if provided (for vouchers)
    if (pdfUrl) {
      mailOptions.attachments = [
        {
          filename: 'voucher.pdf',
          path: pdfUrl,
        },
      ];
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Worker] Email sent: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`[Email Worker] Error processing job ${job.id}:`, error);
    throw error;
  }
}

/**
 * Register email worker
 */
export async function registerEmailWorker() {
  // Process emails with concurrency of 3
  emailQueue.process(3, processEmailJob);

  // Verify transporter connection
  try {
    await transporter.verify();
    console.log('[Email Worker] SMTP connection verified');
  } catch (error) {
    console.warn('[Email Worker] SMTP connection warning:', error);
  }

  console.log('[Email Worker] Registered and listening for jobs');

  return emailQueue;
}
