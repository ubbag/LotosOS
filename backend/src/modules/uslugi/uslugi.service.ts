import { Usluga, WariantUslugi, Doplata } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import {
  CreateUslugaRequest,
  UpdateUslugaRequest,
  CreateWariantRequest,
  UpdateWariantRequest,
  CreateDoplataRequest,
  UpdateDoplataRequest,
} from './uslugi.schemas';

export class UslugiService {
  /**
   * Find all services with variants grouped by category
   */
  async findAll() {
    const uslugi = await prisma.usluga.findMany({
      where: { aktywna: true },
      include: {
        kategoria: true,
        wariantyUslugi: {
          orderBy: { czasMinut: 'asc' },
        },
      },
      orderBy: { kolejnosc: 'asc' },
    });

    // Group by category
    const grouped = uslugi.reduce(
      (acc, usluga) => {
        const categoryName = usluga.kategoria?.nazwa || 'Bez kategorii';
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(usluga);
        return acc;
      },
      {} as Record<string, (typeof uslugi)[number][]>
    );

    return grouped;
  }

  /**
   * Find single service by ID with variants
   */
  async findById(id: string) {
    const usluga = await prisma.usluga.findUnique({
      where: { id },
      include: {
        wariantyUslugi: {
          orderBy: { czasMinut: 'asc' },
        },
      },
    });

    if (!usluga) {
      throw new NotFoundError('Usługa nie została znaleziona');
    }

    return usluga;
  }

  /**
   * Create service with variants in transaction
   */
  async create(data: CreateUslugaRequest) {
    const usluga = await prisma.usluga.create({
      data: {
        nazwa: data.nazwa,
        kategoriaId: data.kategoriaId || null,
        opis: data.opis || null,
        aktywna: true,
        wariantyUslugi: {
          createMany: {
            data: data.warianty.map((w) => ({
              czasMinut: w.czasMinut,
              cenaRegularna: parseFloat(w.cenaRegularna.toString()),
              cenaPromocyjna: w.cenaPromocyjna ? parseFloat(w.cenaPromocyjna.toString()) : null,
            })),
          },
        },
      },
      include: {
        kategoria: true,
        wariantyUslugi: true,
      },
    });

    return usluga;
  }

  /**
   * Update service
   */
  async update(id: string, data: UpdateUslugaRequest): Promise<Usluga> {
    const usluga = await prisma.usluga.findUnique({ where: { id } });
    if (!usluga) {
      throw new NotFoundError('Usługa nie została znaleziona');
    }

    const updated = await prisma.usluga.update({
      where: { id },
      data: {
        nazwa: data.nazwa,
        kategoriaId: data.kategoriaId,
        opis: data.opis,
        aktywna: data.aktywna,
        kolejnosc: data.kolejnosc,
      },
      include: {
        kategoria: true,
      },
    });

    return updated;
  }

  /**
   * Delete service
   */
  async delete(id: string): Promise<void> {
    const usluga = await prisma.usluga.findUnique({ where: { id } });
    if (!usluga) {
      throw new NotFoundError('Usługa nie została znaleziona');
    }

    // Delete service (variants will be cascade deleted due to onDelete: Cascade in schema)
    await prisma.usluga.delete({ where: { id } });
  }

  /**
   * Add variant to service
   */
  async addWariant(uslugaId: string, data: CreateWariantRequest): Promise<WariantUslugi> {
    // Verify service exists
    const usluga = await prisma.usluga.findUnique({ where: { id: uslugaId } });
    if (!usluga) {
      throw new NotFoundError('Usługa nie została znaleziona');
    }

    const wariant = await prisma.wariantUslugi.create({
      data: {
        uslugaId,
        czasMinut: data.czasMinut,
        cenaRegularna: parseFloat(data.cenaRegularna.toString()),
        cenaPromocyjna: data.cenaPromocyjna ? parseFloat(data.cenaPromocyjna.toString()) : null,
      },
    });

    return wariant;
  }

  /**
   * Update variant
   */
  async updateWariant(wariantId: string, data: UpdateWariantRequest): Promise<WariantUslugi> {
    const wariant = await prisma.wariantUslugi.findUnique({ where: { id: wariantId } });
    if (!wariant) {
      throw new NotFoundError('Wariant nie został znaleziony');
    }

    const updated = await prisma.wariantUslugi.update({
      where: { id: wariantId },
      data: {
        czasMinut: data.czasMinut,
        cenaRegularna: data.cenaRegularna ? parseFloat(data.cenaRegularna.toString()) : undefined,
        cenaPromocyjna: data.cenaPromocyjna ? parseFloat(data.cenaPromocyjna.toString()) : undefined,
      },
    });

    return updated;
  }

  /**
   * Delete variant
   */
  async deleteWariant(wariantId: string): Promise<void> {
    const wariant = await prisma.wariantUslugi.findUnique({ where: { id: wariantId } });
    if (!wariant) {
      throw new NotFoundError('Wariant nie został znaleziony');
    }

    await prisma.wariantUslugi.delete({ where: { id: wariantId } });
  }

  /**
   * Find all add-ons
   */
  async findAllDoplaty() {
    const doplaty = await prisma.doplata.findMany({
      where: { aktywna: true },
      orderBy: { nazwa: 'asc' },
    });

    return doplaty;
  }

  /**
   * Create add-on
   */
  async createDoplata(data: CreateDoplataRequest): Promise<Doplata> {
    const doplata = await prisma.doplata.create({
      data: {
        nazwa: data.nazwa,
        cena: parseFloat(data.cena.toString()),
        aktywna: true,
      },
    });

    return doplata;
  }

  /**
   * Update add-on
   */
  async updateDoplata(id: string, data: UpdateDoplataRequest): Promise<Doplata> {
    const doplata = await prisma.doplata.findUnique({ where: { id } });
    if (!doplata) {
      throw new NotFoundError('Dopłata nie została znaleziona');
    }

    const updated = await prisma.doplata.update({
      where: { id },
      data: {
        nazwa: data.nazwa,
        cena: data.cena ? parseFloat(data.cena.toString()) : undefined,
        aktywna: data.aktywna,
      },
    });

    return updated;
  }
}

export const uslugiService = new UslugiService();
