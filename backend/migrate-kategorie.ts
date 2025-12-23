import { PrismaClient } from '@prisma/client';
import { Database } from 'better-sqlite3';
const db = require('better-sqlite3');

async function migrate() {
  const prisma = new PrismaClient();
  const sqlite = db('./prisma/dev.db');

  try {
    // Get all existing services with categories
    const uslugi = await prisma.$queryRaw<any[]>`SELECT id, nazwa, kategoria FROM uslugi WHERE kategoria IS NOT NULL`;

    console.log('Existing services:', uslugi);

    // Create kategorie table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS kategorie (
        id TEXT PRIMARY KEY NOT NULL,
        nazwa TEXT NOT NULL UNIQUE,
        opis TEXT,
        aktywna INTEGER NOT NULL DEFAULT 1,
        kolejnosc INTEGER NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS kategorie_aktywna_idx ON kategorie(aktywna);
      CREATE INDEX IF NOT EXISTS kategorie_kolejnosc_idx ON kategorie(kolejnosc);
    `);

    // Get unique categories
    const uniqueKategorie = [...new Set(uslugi.map(u => u.kategoria))];
    console.log('Unique categories:', uniqueKategorie);

    // Insert categories
    const insertKategoria = sqlite.prepare('INSERT INTO kategorie (id, nazwa, aktywna, kolejnosc) VALUES (?, ?, 1, ?)');
    const kategorieMap = new Map();

    uniqueKategorie.forEach((kat, idx) => {
      const id = `kat_${Date.now()}_${idx}`;
      insertKategoria.run(id, kat, idx);
      kategorieMap.set(kat, id);
      console.log(`Created category: ${kat} with id: ${id}`);
    });

    // Add kategoriaId column to uslugi
    sqlite.exec(`ALTER TABLE uslugi ADD COLUMN kategoriaId TEXT;`);

    // Update uslugi with kategoriaId
    const updateUsluga = sqlite.prepare('UPDATE uslugi SET kategoriaId = ? WHERE id = ?');
    for (const usluga of uslugi) {
      const kategoriaId = kategorieMap.get(usluga.kategoria);
      updateUsluga.run(kategoriaId, usluga.id);
      console.log(`Updated service ${usluga.nazwa} with category ${usluga.kategoria} (${kategoriaId})`);
    }

    // Create index
    sqlite.exec(`CREATE INDEX IF NOT EXISTS uslugi_kategoriaId_idx ON uslugi(kategoriaId);`);

    // Drop old kategoria column
    console.log('Dropping old kategoria column...');
    sqlite.exec(`
      -- SQLite doesn't support DROP COLUMN, so we need to recreate the table
      PRAGMA foreign_keys=off;

      CREATE TABLE uslugi_new (
        id TEXT PRIMARY KEY NOT NULL,
        nazwa TEXT NOT NULL,
        kategoriaId TEXT,
        opis TEXT,
        aktywna INTEGER NOT NULL DEFAULT 1,
        kolejnosc INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (kategoriaId) REFERENCES kategorie(id) ON DELETE SET NULL
      );

      INSERT INTO uslugi_new SELECT id, nazwa, kategoriaId, opis, aktywna, kolejnosc FROM uslugi;

      DROP TABLE uslugi;
      ALTER TABLE uslugi_new RENAME TO uslugi;

      CREATE INDEX uslugi_aktywna_idx ON uslugi(aktywna);
      CREATE INDEX uslugi_kategoriaId_idx ON uslugi(kategoriaId);

      PRAGMA foreign_keys=on;
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    sqlite.close();
  }
}

migrate();
