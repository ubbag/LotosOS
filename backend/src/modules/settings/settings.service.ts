import { prisma } from '../../shared/prisma';

export class SettingsService {
  /**
   * Get a setting by key
   */
  async getSetting(key: string) {
    const setting = await prisma.settings.findUnique({
      where: { klucz: key },
    });
    return setting?.wartosc || null;
  }

  /**
   * Set a setting
   */
  async setSetting(key: string, value: string) {
    const setting = await prisma.settings.upsert({
      where: { klucz: key },
      update: { wartosc: value },
      create: { klucz: key, wartosc: value },
    });
    return setting;
  }

  /**
   * Get salon opening hours
   */
  async getOpeningHours() {
    const openingHour = await this.getSetting('godzinaOtwarcia');
    const closingHour = await this.getSetting('godzinaZamkniecia');

    return {
      godzinaOtwarcia: openingHour ? parseInt(openingHour) : 10,
      godzinaZamkniecia: closingHour ? parseInt(closingHour) : 23,
    };
  }

  /**
   * Set salon opening hours
   */
  async setOpeningHours(godzinaOtwarcia: number, godzinaZamkniecia: number) {
    if (godzinaOtwarcia < 0 || godzinaOtwarcia > 23 || godzinaZamkniecia < 0 || godzinaZamkniecia > 23) {
      throw new Error('Godziny muszą być w zakresie 0-23');
    }

    if (godzinaOtwarcia >= godzinaZamkniecia) {
      throw new Error('Godzina otwarcia musi być wcześniejsza niż godzina zamknięcia');
    }

    await this.setSetting('godzinaOtwarcia', godzinaOtwarcia.toString());
    await this.setSetting('godzinaZamkniecia', godzinaZamkniecia.toString());

    return this.getOpeningHours();
  }
}

export const settingsService = new SettingsService();
