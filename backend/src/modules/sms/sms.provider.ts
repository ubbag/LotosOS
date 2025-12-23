import { env } from '../../config/env';

/**
 * SMS Provider Interface
 */
export interface ISMSProvider {
  send(telefon: string, tresc: string): Promise<{ id: string; status: string }>;
}

/**
 * SMS API Provider (SMSAPI.pl integration)
 */
export class SMSAPIProvider implements ISMSProvider {
  private apiKey: string;
  private senderName: string;
  private apiUrl = 'https://api.smsapi.pl/sms/send';
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor(apiKey: string, senderName: string) {
    this.apiKey = apiKey;
    this.senderName = senderName;
  }

  /**
   * Send SMS via SMSAPI
   */
  async send(telefon: string, tresc: string): Promise<{ id: string; status: string }> {
    // Normalize phone number to +48 format
    let normalizedPhone = telefon.replace(/\s/g, '');
    if (normalizedPhone.startsWith('0048')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('48')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '+48' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+48' + normalizedPhone;
    }

    // Truncate message to 160 characters (or 155 with concatenated SMS)
    const message = tresc.substring(0, 160);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            access_token: this.apiKey,
            message: message,
            to: normalizedPhone,
            sender: this.senderName,
          }).toString(),
        });

        if (!response.ok) {
          throw new Error(`SMS API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as any;

        if (data.error) {
          throw new Error(`SMS API returned error: ${data.error}`);
        }

        // SMSAPI returns success response
        if (data.result === true || (data.items && data.items.length > 0)) {
          const messageId = data.items?.[0]?.id || `sms_${Date.now()}`;
          return {
            id: messageId,
            status: 'WYSLANY',
          };
        }

        throw new Error('SMS API returned unexpected response');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.maxRetries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to send SMS after ${this.maxRetries} attempts: ${lastError?.message}`);
  }
}

/**
 * Mock SMS Provider for testing
 */
export class MockSMSProvider implements ISMSProvider {
  async send(telefon: string, tresc: string): Promise<{ id: string; status: string }> {
    console.log(`[MOCK SMS] To: ${telefon}, Message: ${tresc}`);
    return {
      id: `mock_${Date.now()}`,
      status: 'WYSLANY',
    };
  }
}

/**
 * Factory function to get SMS provider
 */
export function createSMSProvider(): ISMSProvider {
  const provider = env.smsProvider || 'mock';
  const apiKey = env.smsApiKey || '';
  const senderName = env.smsSenderName || 'LotosSPA';

  if (provider === 'smsapi') {
    if (!apiKey) {
      console.warn('SMS_API_KEY not set, falling back to mock provider');
      return new MockSMSProvider();
    }
    return new SMSAPIProvider(apiKey, senderName);
  }

  return new MockSMSProvider();
}

/**
 * Global SMS provider instance
 */
export const smsProvider = createSMSProvider();
