-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "imie" TEXT NOT NULL,
    "rola" TEXT NOT NULL DEFAULT 'RECEPCJA',
    "aktywny" BOOLEAN NOT NULL DEFAULT true,
    "ostatnieLogowanie" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "klienci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imie" TEXT NOT NULL,
    "nazwisko" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "email" TEXT,
    "zrodlo" TEXT,
    "aktywny" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "notatkiKlienta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "klientId" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "tresc" TEXT NOT NULL,
    "pokazujPrzyRezerwacji" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notatkiKlienta_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "klienci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notatkiKlienta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "masazysci" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imie" TEXT NOT NULL,
    "nazwisko" TEXT NOT NULL,
    "specjalizacje" TEXT NOT NULL DEFAULT '[]',
    "jezyki" TEXT NOT NULL DEFAULT '[]',
    "zdjecieUrl" TEXT,
    "aktywny" BOOLEAN NOT NULL DEFAULT true,
    "kolejnosc" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "grafikPracy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masazystaId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "godzinaOd" DATETIME NOT NULL,
    "godzinaDo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRACUJE',
    CONSTRAINT "grafikPracy_masazystaId_fkey" FOREIGN KEY ("masazystaId") REFERENCES "masazysci" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "gabinety" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numer" TEXT NOT NULL,
    "nazwa" TEXT NOT NULL,
    "aktywny" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "uslugi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nazwa" TEXT NOT NULL,
    "kategoria" TEXT NOT NULL,
    "opis" TEXT,
    "aktywna" BOOLEAN NOT NULL DEFAULT true,
    "kolejnosc" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "wariantyUslugi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uslugaId" TEXT NOT NULL,
    "czasMinut" INTEGER NOT NULL,
    "cenaRegularna" REAL NOT NULL,
    "cenaPromocyjna" REAL,
    CONSTRAINT "wariantyUslugi_uslugaId_fkey" FOREIGN KEY ("uslugaId") REFERENCES "uslugi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "doplaty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nazwa" TEXT NOT NULL,
    "cena" REAL NOT NULL,
    "aktywna" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "rezerwacje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numer" TEXT NOT NULL,
    "klientId" TEXT NOT NULL,
    "masazystaId" TEXT NOT NULL,
    "gabinetId" TEXT NOT NULL,
    "uslugaId" TEXT NOT NULL,
    "wariantId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "godzinaOd" DATETIME NOT NULL,
    "godzinaDo" DATETIME NOT NULL,
    "cenaCalokowita" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOWA',
    "zrodlo" TEXT NOT NULL,
    "platnoscMetoda" TEXT NOT NULL,
    "platnoscStatus" TEXT NOT NULL DEFAULT 'NIEOPLACONA',
    "notatki" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rezerwacje_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "klienci" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rezerwacje_masazystaId_fkey" FOREIGN KEY ("masazystaId") REFERENCES "masazysci" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rezerwacje_gabinetId_fkey" FOREIGN KEY ("gabinetId") REFERENCES "gabinety" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rezerwacje_uslugaId_fkey" FOREIGN KEY ("uslugaId") REFERENCES "uslugi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rezerwacje_wariantId_fkey" FOREIGN KEY ("wariantId") REFERENCES "wariantyUslugi" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rezerwacje_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rezerwacjeDoplata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rezerwacjaId" TEXT NOT NULL,
    "doplataId" TEXT NOT NULL,
    "cena" REAL NOT NULL,
    CONSTRAINT "rezerwacjeDoplata_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rezerwacjeDoplata_doplataId_fkey" FOREIGN KEY ("doplataId") REFERENCES "doplaty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pakietyDefinicja" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nazwa" TEXT NOT NULL,
    "liczbaGodzin" INTEGER NOT NULL,
    "cena" REAL NOT NULL,
    "waznoscDni" INTEGER NOT NULL,
    "aktywny" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "pakietyKlienta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "klientId" TEXT NOT NULL,
    "pakietId" TEXT NOT NULL,
    "dataZakupu" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "godzinyWykupione" INTEGER NOT NULL,
    "godzinyWykorzystane" INTEGER NOT NULL DEFAULT 0,
    "godzinyPozostale" INTEGER NOT NULL,
    "dataWaznosci" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTYWNY',
    CONSTRAINT "pakietyKlienta_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "klienci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pakietyKlienta_pakietId_fkey" FOREIGN KEY ("pakietId") REFERENCES "pakietyDefinicja" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wykorzystaniePakietu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pakietKlientaId" TEXT NOT NULL,
    "rezerwacjaId" TEXT NOT NULL,
    "godzinyOdliczone" INTEGER NOT NULL,
    "saldoPo" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wykorzystaniePakietu_pakietKlientaId_fkey" FOREIGN KEY ("pakietKlientaId") REFERENCES "pakietyKlienta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "wykorzystaniePakietu_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vouchery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kod" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "wartoscPoczatkowa" REAL NOT NULL,
    "wartoscPozostala" REAL NOT NULL,
    "uslugaId" TEXT,
    "kupujacyImie" TEXT NOT NULL,
    "kupujacyEmail" TEXT NOT NULL,
    "obdarowanyImie" TEXT,
    "obdarowanyEmail" TEXT,
    "wiadomosc" TEXT,
    "dataZakupu" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataWaznosci" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTYWNY',
    "zrodlo" TEXT NOT NULL,
    CONSTRAINT "vouchery_uslugaId_fkey" FOREIGN KEY ("uslugaId") REFERENCES "uslugi" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "realizacjeVouchera" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "voucherId" TEXT NOT NULL,
    "rezerwacjaId" TEXT NOT NULL,
    "kwota" REAL NOT NULL,
    "saldoPo" REAL NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "realizacjeVouchera_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchery" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "realizacjeVouchera_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transakcje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rezerwacjaId" TEXT,
    "pakietKlientaId" TEXT,
    "voucherId" TEXT,
    "kwota" REAL NOT NULL,
    "metoda" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "notatki" TEXT,
    CONSTRAINT "transakcje_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transakcje_pakietKlientaId_fkey" FOREIGN KEY ("pakietKlientaId") REFERENCES "pakietyKlienta" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transakcje_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchery" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transakcje_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "zamkniecia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "utargSpodziewany" REAL NOT NULL,
    "utargRzeczywisty" REAL NOT NULL,
    "roznica" REAL NOT NULL,
    "gotowkaSpodziewana" REAL NOT NULL,
    "gotowkaRzeczywista" REAL NOT NULL,
    "kartaSpodziewana" REAL NOT NULL,
    "kartaRzeczywista" REAL NOT NULL,
    "userId" TEXT NOT NULL,
    "uwagi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zamkniecia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "smsLogi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "klientId" TEXT NOT NULL,
    "rezerwacjaId" TEXT,
    "typ" TEXT NOT NULL,
    "tresc" TEXT NOT NULL,
    "dataWyslania" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'WYSLANY',
    "bladOpis" TEXT,
    CONSTRAINT "smsLogi_klientId_fkey" FOREIGN KEY ("klientId") REFERENCES "klienci" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "smsLogi_rezerwacjaId_fkey" FOREIGN KEY ("rezerwacjaId") REFERENCES "rezerwacje" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "klienci_telefon_key" ON "klienci"("telefon");

-- CreateIndex
CREATE INDEX "klienci_telefon_idx" ON "klienci"("telefon");

-- CreateIndex
CREATE INDEX "klienci_aktywny_idx" ON "klienci"("aktywny");

-- CreateIndex
CREATE INDEX "notatkiKlienta_klientId_idx" ON "notatkiKlienta"("klientId");

-- CreateIndex
CREATE INDEX "notatkiKlienta_typ_idx" ON "notatkiKlienta"("typ");

-- CreateIndex
CREATE INDEX "masazysci_aktywny_idx" ON "masazysci"("aktywny");

-- CreateIndex
CREATE INDEX "masazysci_kolejnosc_idx" ON "masazysci"("kolejnosc");

-- CreateIndex
CREATE INDEX "grafikPracy_masazystaId_idx" ON "grafikPracy"("masazystaId");

-- CreateIndex
CREATE INDEX "grafikPracy_data_idx" ON "grafikPracy"("data");

-- CreateIndex
CREATE UNIQUE INDEX "grafikPracy_masazystaId_data_key" ON "grafikPracy"("masazystaId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "gabinety_numer_key" ON "gabinety"("numer");

-- CreateIndex
CREATE INDEX "gabinety_aktywny_idx" ON "gabinety"("aktywny");

-- CreateIndex
CREATE UNIQUE INDEX "uslugi_nazwa_key" ON "uslugi"("nazwa");

-- CreateIndex
CREATE INDEX "uslugi_aktywna_idx" ON "uslugi"("aktywna");

-- CreateIndex
CREATE INDEX "uslugi_kategoria_idx" ON "uslugi"("kategoria");

-- CreateIndex
CREATE INDEX "wariantyUslugi_uslugaId_idx" ON "wariantyUslugi"("uslugaId");

-- CreateIndex
CREATE UNIQUE INDEX "doplaty_nazwa_key" ON "doplaty"("nazwa");

-- CreateIndex
CREATE UNIQUE INDEX "rezerwacje_numer_key" ON "rezerwacje"("numer");

-- CreateIndex
CREATE INDEX "rezerwacje_klientId_idx" ON "rezerwacje"("klientId");

-- CreateIndex
CREATE INDEX "rezerwacje_masazystaId_idx" ON "rezerwacje"("masazystaId");

-- CreateIndex
CREATE INDEX "rezerwacje_gabinetId_idx" ON "rezerwacje"("gabinetId");

-- CreateIndex
CREATE INDEX "rezerwacje_uslugaId_idx" ON "rezerwacje"("uslugaId");

-- CreateIndex
CREATE INDEX "rezerwacje_data_idx" ON "rezerwacje"("data");

-- CreateIndex
CREATE INDEX "rezerwacje_status_idx" ON "rezerwacje"("status");

-- CreateIndex
CREATE INDEX "rezerwacje_platnoscStatus_idx" ON "rezerwacje"("platnoscStatus");

-- CreateIndex
CREATE INDEX "rezerwacjeDoplata_rezerwacjaId_idx" ON "rezerwacjeDoplata"("rezerwacjaId");

-- CreateIndex
CREATE INDEX "rezerwacjeDoplata_doplataId_idx" ON "rezerwacjeDoplata"("doplataId");

-- CreateIndex
CREATE UNIQUE INDEX "rezerwacjeDoplata_rezerwacjaId_doplataId_key" ON "rezerwacjeDoplata"("rezerwacjaId", "doplataId");

-- CreateIndex
CREATE UNIQUE INDEX "pakietyDefinicja_nazwa_key" ON "pakietyDefinicja"("nazwa");

-- CreateIndex
CREATE INDEX "pakietyDefinicja_aktywny_idx" ON "pakietyDefinicja"("aktywny");

-- CreateIndex
CREATE INDEX "pakietyKlienta_klientId_idx" ON "pakietyKlienta"("klientId");

-- CreateIndex
CREATE INDEX "pakietyKlienta_status_idx" ON "pakietyKlienta"("status");

-- CreateIndex
CREATE INDEX "pakietyKlienta_dataWaznosci_idx" ON "pakietyKlienta"("dataWaznosci");

-- CreateIndex
CREATE INDEX "wykorzystaniePakietu_pakietKlientaId_idx" ON "wykorzystaniePakietu"("pakietKlientaId");

-- CreateIndex
CREATE INDEX "wykorzystaniePakietu_rezerwacjaId_idx" ON "wykorzystaniePakietu"("rezerwacjaId");

-- CreateIndex
CREATE UNIQUE INDEX "vouchery_kod_key" ON "vouchery"("kod");

-- CreateIndex
CREATE INDEX "vouchery_kod_idx" ON "vouchery"("kod");

-- CreateIndex
CREATE INDEX "vouchery_status_idx" ON "vouchery"("status");

-- CreateIndex
CREATE INDEX "vouchery_dataWaznosci_idx" ON "vouchery"("dataWaznosci");

-- CreateIndex
CREATE INDEX "realizacjeVouchera_voucherId_idx" ON "realizacjeVouchera"("voucherId");

-- CreateIndex
CREATE INDEX "realizacjeVouchera_rezerwacjaId_idx" ON "realizacjeVouchera"("rezerwacjaId");

-- CreateIndex
CREATE INDEX "transakcje_rezerwacjaId_idx" ON "transakcje"("rezerwacjaId");

-- CreateIndex
CREATE INDEX "transakcje_pakietKlientaId_idx" ON "transakcje"("pakietKlientaId");

-- CreateIndex
CREATE INDEX "transakcje_voucherId_idx" ON "transakcje"("voucherId");

-- CreateIndex
CREATE INDEX "transakcje_userId_idx" ON "transakcje"("userId");

-- CreateIndex
CREATE INDEX "transakcje_data_idx" ON "transakcje"("data");

-- CreateIndex
CREATE UNIQUE INDEX "zamkniecia_data_key" ON "zamkniecia"("data");

-- CreateIndex
CREATE INDEX "zamkniecia_data_idx" ON "zamkniecia"("data");

-- CreateIndex
CREATE INDEX "zamkniecia_userId_idx" ON "zamkniecia"("userId");

-- CreateIndex
CREATE INDEX "smsLogi_klientId_idx" ON "smsLogi"("klientId");

-- CreateIndex
CREATE INDEX "smsLogi_rezerwacjaId_idx" ON "smsLogi"("rezerwacjaId");

-- CreateIndex
CREATE INDEX "smsLogi_typ_idx" ON "smsLogi"("typ");

-- CreateIndex
CREATE INDEX "smsLogi_status_idx" ON "smsLogi"("status");
