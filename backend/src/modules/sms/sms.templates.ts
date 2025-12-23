/**
 * SMS Templates for Lotos SPA
 */

export interface SMSContext {
  [key: string]: string | number;
}

export interface SMSTemplate {
  type: string;
  template: string;
  description: string;
}

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  POTWIERDZENIE: {
    type: 'POTWIERDZENIE',
    template:
      'Lotos SPA: Potwierdzamy rezerwację na {data} o {godzina}. {usluga}. Adres: ul. Europejska 51. Do zobaczenia!',
    description: 'Reservation confirmation SMS',
  },
  PRZYPOMNIENIE: {
    type: 'PRZYPOMNIENIE',
    template: 'Lotos SPA: Przypominamy o wizycie {kiedy} o {godzina}. {usluga}, {masazysta}. Do zobaczenia!',
    description: 'Reservation reminder SMS',
  },
  PAKIET_KONCZY_SIE: {
    type: 'PAKIET',
    template: 'Lotos SPA: W Twoim pakiecie zostało {godziny}h. Zapraszamy do wykorzystania lub odnowienia.',
    description: 'Package ending soon notification',
  },
  PAKIET_WYGASA: {
    type: 'PAKIET',
    template: 'Lotos SPA: Twój pakiet wygasa {data}. Pozostało {godziny}h do wykorzystania.',
    description: 'Package expiring notification',
  },
};

/**
 * Render SMS template with context variables
 */
export function renderSMSTemplate(templateKey: string, context: SMSContext): string {
  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`SMS template not found: ${templateKey}`);
  }

  let message = template.template;

  // Replace all {variable} placeholders with context values
  Object.entries(context).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, String(value));
  });

  return message;
}

/**
 * Get template by type
 */
export function getTemplate(templateKey: string): SMSTemplate {
  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`SMS template not found: ${templateKey}`);
  }

  return template;
}
