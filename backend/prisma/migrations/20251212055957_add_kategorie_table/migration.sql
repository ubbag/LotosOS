/*
  Warnings:

  - You are about to drop the column `createdAt` on the `masazysci` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `masazysci` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `uslugi` table. All the data in the column will be lost.
  - You are about to drop the column `kategoria` on the `uslugi` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `uslugi` table. All the data in the column will be lost.
  - You are about to drop the column `godzinyOdliczone` on the `wykorzystaniePakietu` table. All the data in the column will be lost.
  - You are about to drop the column `saldoPo` on the `wykorzystaniePakietu` table. All the data in the column will be lost.
  - Added the required column `wykorzystaneGodziny` to the `wykorzystaniePakietu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "gabinety" ADD COLUMN "notatki" TEXT;

-- CreateTable
CREATE TABLE "kategorie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nazwa" TEXT NOT NULL,
    "opis" TEXT,
    "aktywna" BOOLEAN NOT NULL DEFAULT true,
    "kolejnosc" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_masazysci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imie" TEXT NOT NULL,
    "nazwisko" TEXT NOT NULL,
    "specjalizacje" TEXT NOT NULL,
    "jezyki" TEXT NOT NULL,
    "zdjecieUrl" TEXT,
    "aktywny" BOOLEAN NOT NULL DEFAULT true,
    "kolejnosc" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_masazysci" ("aktywny", "id", "imie", "jezyki", "kolejnosc", "nazwisko", "specjalizacje", "zdjecieUrl") SELECT "aktywny", "id", "imie", "jezyki", "kolejnosc", "nazwisko", "specjalizacje", "zdjecieUrl" FROM "masazysci";
DROP TABLE "masazysci";
ALTER TABLE "new_masazysci" RENAME TO "masazysci";
CREATE INDEX "masazysci_aktywny_idx" ON "masazysci"("aktywny");
CREATE INDEX "masazysci_kolejnosc_idx" ON "masazysci"("kolejnosc");
CREATE TABLE "new_smsLogi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "klientId" TEXT,
    "rezerwacjaId" TEXT,
    "typ" TEXT NOT NULL,
    "tresc" TEXT NOT NULL,
    "dataWyslania" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'WYSLANY',
    "bladOpis" TEXT,
    CONSTRAINT "smsLogi_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "klienci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "smsLogi_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_smsLogi" ("bladOpis", "dataWyslania", "id", "klientId", "rezerwacjaId", "status", "tresc", "typ") SELECT "bladOpis", "dataWyslania", "id", "klientId", "rezerwacjaId", "status", "tresc", "typ" FROM "smsLogi";
DROP TABLE "smsLogi";
ALTER TABLE "new_smsLogi" RENAME TO "smsLogi";
CREATE INDEX "smsLogi_klientId_idx" ON "smsLogi"("klientId");
CREATE INDEX "smsLogi_rezerwacjaId_idx" ON "smsLogi"("rezerwacjaId");
CREATE INDEX "smsLogi_typ_idx" ON "smsLogi"("typ");
CREATE INDEX "smsLogi_status_idx" ON "smsLogi"("status");
CREATE TABLE "new_uslugi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nazwa" TEXT NOT NULL,
    "kategoriaId" TEXT,
    "opis" TEXT,
    "aktywna" BOOLEAN NOT NULL DEFAULT true,
    "kolejnosc" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "uslugi_kategoriaId_fkey" FOREIGN KEY ("kategoriaId") REFERENCES "kategorie" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_uslugi" ("aktywna", "id", "kolejnosc", "nazwa", "opis") SELECT "aktywna", "id", "kolejnosc", "nazwa", "opis" FROM "uslugi";
DROP TABLE "uslugi";
ALTER TABLE "new_uslugi" RENAME TO "uslugi";
CREATE INDEX "uslugi_aktywna_idx" ON "uslugi"("aktywna");
CREATE INDEX "uslugi_kategoriaId_idx" ON "uslugi"("kategoriaId");
CREATE TABLE "new_wykorzystaniePakietu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pakietKlientaId" TEXT NOT NULL,
    "rezerwacjaId" TEXT NOT NULL,
    "wykorzystaneGodziny" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wykorzystaniePakietu_pakietKlientaId_fkey" FOREIGN KEY ("pakietKlientaId") REFERENCES "pakietyKlienta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wykorzystaniePakietu_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wykorzystaniePakietu" ("data", "id", "pakietKlientaId", "rezerwacjaId") SELECT "data", "id", "pakietKlientaId", "rezerwacjaId" FROM "wykorzystaniePakietu";
DROP TABLE "wykorzystaniePakietu";
ALTER TABLE "new_wykorzystaniePakietu" RENAME TO "wykorzystaniePakietu";
CREATE INDEX "wykorzystaniePakietu_pakietKlientaId_idx" ON "wykorzystaniePakietu"("pakietKlientaId");
CREATE INDEX "wykorzystaniePakietu_rezerwacjaId_idx" ON "wykorzystaniePakietu"("rezerwacjaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "kategorie_nazwa_key" ON "kategorie"("nazwa");

-- CreateIndex
CREATE INDEX "kategorie_aktywna_idx" ON "kategorie"("aktywna");

-- CreateIndex
CREATE INDEX "kategorie_kolejnosc_idx" ON "kategorie"("kolejnosc");

-- CreateIndex
CREATE INDEX "rezerwacje_data_masazystaId_idx" ON "rezerwacje"("data", "masazystaId");

-- CreateIndex
CREATE INDEX "rezerwacje_data_gabinetId_idx" ON "rezerwacje"("data", "gabinetId");
