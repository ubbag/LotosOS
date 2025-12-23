import { Kategoria } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import { prisma } from '../../shared/prisma';
import { CreateKategoriaRequest, UpdateKategoriaRequest } from './kategorie.schemas';

export class KategorieService {
  /**
   * Find all categories
   */
  async findAll() {
    const kategorie = await prisma.kategoria.findMany({
      where: { aktywna: true },
      orderBy: { kolejnosc: 'asc' },
      include: {
        _count: {
          select: { uslugi: true },
        },
      },
    });

    return kategorie;
  }

  /**
   * Find single category by ID
   */
  async findById(id: string) {
    const kategoria = await prisma.kategoria.findUnique({
      where: { id },
      include: {
        uslugi: {
          where: { aktywna: true },
          orderBy: { kolejnosc: 'asc' },
        },
      },
    });

    if (!kategoria) {
      throw new NotFoundError('Kategoria nie została znaleziona');
    }

    return kategoria;
  }

  /**
   * Create category
   */
  async create(data: CreateKategoriaRequest): Promise<Kategoria> {
    const kategoria = await prisma.kategoria.create({
      data: {
        nazwa: data.nazwa,
        opis: data.opis || null,
        aktywna: true,
        kolejnosc: data.kolejnosc || 0,
      },
    });

    return kategoria;
  }

  /**
   * Update category
   */
  async update(id: string, data: UpdateKategoriaRequest): Promise<Kategoria> {
    const kategoria = await prisma.kategoria.findUnique({ where: { id } });
    if (!kategoria) {
      throw new NotFoundError('Kategoria nie została znaleziona');
    }

    const updated = await prisma.kategoria.update({
      where: { id },
      data: {
        nazwa: data.nazwa,
        opis: data.opis,
        aktywna: data.aktywna,
        kolejnosc: data.kolejnosc,
      },
    });

    return updated;
  }

  /**
   * Delete category (soft delete)
   */
  async delete(id: string): Promise<void> {
    const kategoria = await prisma.kategoria.findUnique({ where: { id } });
    if (!kategoria) {
      throw new NotFoundError('Kategoria nie została znaleziona');
    }

    // Soft delete - just mark as inactive
    await prisma.kategoria.update({
      where: { id },
      data: { aktywna: false },
    });
  }
}

export const kategorieService = new KategorieService();
