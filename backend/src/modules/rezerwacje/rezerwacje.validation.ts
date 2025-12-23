import { prisma } from '../../shared/prisma';
import { CreateRezerwacjaRequest } from './rezerwacje.schemas';
import { sprawdzNakladanieSie } from './rezerwacje.utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: {
    masazystaId?: string;
    gabinetId?: string;
    godzinaDo?: Date;
  };
}

/**
 * Comprehensive reservation validation
 */
export async function validateRezerwacja(data: CreateRezerwacjaRequest): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validationData: { masazystaId?: string; gabinetId?: string; godzinaDo?: Date } = {};

  // Validate client exists
  const klient = await prisma.klient.findUnique({
    where: { id: data.klientId },
    include: { notatkiKlienta: true },
  });

  if (!klient) {
    errors.push('Client not found');
    return { valid: false, errors, warnings };
  }

  // Check for medical notes
  const medicalNotes = klient.notatkiKlienta.filter((n) => n.typ === 'MEDYCZNA');
  if (medicalNotes.length > 0) {
    warnings.push(`Client has medical notes: ${medicalNotes.map((n) => n.tresc).join('; ')}`);
  }

  // Validate service and variant
  const usluga = await prisma.usluga.findUnique({
    where: { id: data.uslugaId },
    include: { wariantyUslugi: true },
  });

  if (!usluga) {
    errors.push('Service not found');
  } else if (!usluga.aktywna) {
    errors.push('Service is not active');
  }

  const wariant = await prisma.wariantUslugi.findUnique({
    where: { id: data.wariantId },
  });

  if (!wariant) {
    errors.push('Service variant not found');
  } else if (wariant.uslugaId !== data.uslugaId) {
    errors.push('Service variant does not belong to selected service');
  }

  // Validate therapist if provided
  let masazystaId = data.masazystaId;
  if (masazystaId) {
    const masazysta = await prisma.masazysta.findUnique({
      where: { id: masazystaId },
      include: {
        grafikPracy: true,
        rezerwacje: true,
      },
    });

    if (!masazysta) {
      errors.push('Therapist not found');
    } else if (!masazysta.aktywny) {
      errors.push('Therapist is not active');
    } else {
      // Check schedule for this date
      const dataDate = new Date(data.data);
      const dayStart = new Date(dataDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dataDate);
      dayEnd.setHours(23, 59, 59, 999);

      const schedule = masazysta.grafikPracy.find(
        (g) => new Date(g.data) >= dayStart && new Date(g.data) <= dayEnd
      );

      if (!schedule) {
        errors.push('Therapist has no schedule for this date');
      } else if (schedule.status !== 'PRACUJE') {
        errors.push(`Therapist status on this date: ${schedule.status}`);
      } else {
        // Check time fits in schedule
        const reqStart = new Date(data.godzinaOd);
        const scheduleStart = new Date(schedule.godzinaOd);
        const scheduleEnd = new Date(schedule.godzinaDo);

        if (reqStart < scheduleStart || reqStart >= scheduleEnd) {
          errors.push('Requested time is outside therapist working hours');
        }

        // Check for overlapping reservations
        const hoursFromVariant = wariant ? wariant.czasMinut / 60 : 1;
        const endTime = new Date(reqStart);
        endTime.setHours(endTime.getHours() + hoursFromVariant);
        validationData.godzinaDo = endTime;

        const overlappingRez = masazysta.rezerwacje.filter(
          (r) =>
            r.status !== 'ANULOWANA' &&
            r.status !== 'NO_SHOW' &&
            sprawdzNakladanieSie(
              { godzinaOd: reqStart, godzinaDo: endTime } as any,
              { godzinaOd: r.godzinaOd, godzinaDo: r.godzinaDo } as any
            )
        );

        if (overlappingRez.length > 0) {
          errors.push('Therapist has conflicting reservation at this time');
        }
      }
    }
  }

  validationData.masazystaId = masazystaId;

  // Validate room if provided
  let gabinetId = data.gabinetId;
  if (gabinetId) {
    const gabinet = await prisma.gabinet.findUnique({
      where: { id: gabinetId },
      include: { rezerwacje: true },
    });

    if (!gabinet) {
      errors.push('Room not found');
    } else if (!gabinet.aktywny) {
      errors.push('Room is not active');
    } else {
      // Check for overlapping reservations
      const reqStart = new Date(data.godzinaOd);
      const hoursFromVariant = wariant ? wariant.czasMinut / 60 : 1;
      const endTime = new Date(reqStart);
      endTime.setHours(endTime.getHours() + hoursFromVariant);

      const overlappingRez = gabinet.rezerwacje.filter(
        (r) =>
          r.status !== 'ANULOWANA' &&
          r.status !== 'NO_SHOW' &&
          sprawdzNakladanieSie(
            { godzinaOd: reqStart, godzinaDo: endTime } as any,
            { godzinaOd: r.godzinaOd, godzinaDo: r.godzinaDo } as any
          )
      );

      if (overlappingRez.length > 0) {
        errors.push('Room is booked at this time');
      }
    }
  }

  validationData.gabinetId = gabinetId;

  // Validate payment method and related data
  if (data.platnoscMetoda === 'PAKIET') {
    const pakiet = await prisma.pakietKlienta.findFirst({
      where: {
        klientId: data.klientId,
        status: 'AKTYWNY',
      },
      include: { pakiet: true },
    });

    if (!pakiet) {
      errors.push('Client has no active package');
    } else if (wariant && pakiet.godzinyPozostale < wariant.czasMinut / 60) {
      errors.push(
        `Insufficient package balance. Required: ${wariant.czasMinut / 60}h, Available: ${pakiet.godzinyPozostale}h`
      );
    }
  }

  // Validate add-ons
  if (data.doplaty && data.doplaty.length > 0) {
    const doplataIds = data.doplaty.map((d) => d.doplataId);
    const doplaty = await prisma.doplata.findMany({
      where: { id: { in: doplataIds } },
    });

    if (doplaty.length !== doplataIds.length) {
      errors.push('Some add-ons not found');
    }

    const inactiveDoplaty = doplaty.filter((d) => !d.aktywna);
    if (inactiveDoplaty.length > 0) {
      errors.push(`Some add-ons are not active: ${inactiveDoplaty.map((d) => d.nazwa).join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: validationData,
  };
}
