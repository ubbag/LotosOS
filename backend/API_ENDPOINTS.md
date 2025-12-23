# Lotos SPA - API Endpoints Reference

## Base URL
```
http://localhost:3000
```

## Authentication Endpoints

### POST /auth/login
Login with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid...",
      "email": "user@example.com",
      "imie": "Jan",
      "rola": "RECEPCJA",
      "aktywny": true
    }
  }
}
```

---

### GET /auth/me
Get current authenticated user profile

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "imie": "Jan",
    "rola": "RECEPCJA"
  }
}
```

---

### POST /auth/change-password
Change password for authenticated user

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

---

## Client Endpoints

### GET /klienci
List all active clients with pagination and filtering

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` - Search by phone/name
- `filter` - ALL | Z_PAKIETEM | BEZ_PAKIETU

**Example:**
```
GET /klienci?page=1&limit=10&search=jan&filter=ALL
```

---

### GET /klienci/szukaj
Quick search for autocomplete

**Query Parameters:**
- `q` (required, min: 2 chars)

**Example:**
```
GET /klienci/szukaj?q=ja
```

---

### GET /klienci/:id
Get single client profile with notes and recent visits

---

### POST /klienci
Create new client

**Request:**
```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "telefon": "123456789",
  "email": "jan@example.com"
}
```

**Note:** Phone is automatically normalized to +48XXXXXXXXX format

---

### PUT /klienci/:id
Update client information

---

### DELETE /klienci/:id
Soft delete client

---

## Client Notes Endpoints

### GET /klienci/:id/notatki
Get all notes for client

---

### POST /klienci/:id/notatki
Add note to client

**Request:**
```json
{
  "typ": "MEDYCZNA",
  "tresc": "Alergic to oil",
  "pokazujPrzyRezerwacji": true
}
```

**Types:** MEDYCZNA | WAZNA | INFO

---

### DELETE /klienci/:id/notatki/:notatkaId
Delete note

---

## Client History

### GET /klienci/:id/historia
Get visit history with pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

---

## All Endpoints Require Authentication

All endpoints require the `Authorization: Bearer <token>` header with valid JWT token from `/auth/login`.

---

## Reservation Endpoints

### POST /rezerwacje
Create new reservation

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "klientId": "client-id",
  "masazystaId": "therapist-id",
  "gabinetId": "cabinet-id",
  "uslugaId": "service-id",
  "wariantId": "variant-id",
  "data": "2025-12-10T00:00:00Z",
  "godzinaOd": "2025-12-10T10:00:00Z",
  "godzinaDo": "2025-12-10T11:00:00Z",
  "cenaCalokowita": 150.00,
  "zrodlo": "TELEFON",
  "platnoscMetoda": "GOTOWKA",
  "notatki": "Optional notes",
  "doplaty": [
    {
      "doplataId": "addon-id",
      "cena": 20.00
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "res-id",
    "numer": "R-20251210-ABC123",
    "klient": { "id": "...", "imie": "Jan", "nazwisko": "Kowalski", "telefon": "+48123456789" },
    "masazysta": { "id": "...", "imie": "Maria", "nazwisko": "Nowak" },
    "gabinet": { "id": "...", "numer": "1", "nazwa": "Gabinet 1" },
    "usluga": { "id": "...", "nazwa": "Masaż relaksacyjny" },
    "wariant": { "czasMinut": 60, "cenaRegularna": 150.00 },
    "data": "2025-12-10T00:00:00Z",
    "godzinaOd": "2025-12-10T10:00:00Z",
    "godzinaDo": "2025-12-10T11:00:00Z",
    "cenaCalokowita": 150.00,
    "status": "NOWA",
    "zrodlo": "TELEFON",
    "platnoscStatus": "NIEOPLACONA",
    "platnoscMetoda": "GOTOWKA",
    "notatki": "Optional notes",
    "doplaty": [],
    "createdAt": "2025-12-04T10:00:00Z",
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

### GET /rezerwacje
List reservations with filters and pagination

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 100) - Items per page
- `status` - Filter by status (NOWA, POTWIERDZONA, W_TRAKCIE, ZAKONCZONA, ANULOWANA, NO_SHOW)
- `klientId` - Filter by client
- `masazystaId` - Filter by therapist
- `gabinetId` - Filter by cabinet
- `dataOd` - Start date (ISO datetime)
- `dataDo` - End date (ISO datetime)
- `platnoscStatus` - Filter by payment status (NIEOPLACONA, OPLACONA, CZESCIOWO)

**Example:**
```
GET /rezerwacje?page=1&limit=10&status=POTWIERDZONA&dataOd=2025-12-01T00:00:00Z&dataDo=2025-12-31T23:59:59Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* array of reservations */ ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### GET /rezerwacje/:id
Get single reservation with full details

---

### PUT /rezerwacje/:id
Update reservation (partial update)

**Request:** Same as POST /rezerwacje but all fields optional

---

### PATCH /rezerwacje/:id/status
Update reservation status

**Request:**
```json
{
  "status": "POTWIERDZONA",
  "notatki": "Optional status notes"
}
```

**Status values:** NOWA | POTWIERDZONA | W_TRAKCIE | ZAKONCZONA | ANULOWANA | NO_SHOW

---

### PATCH /rezerwacje/:id/platnosc
Update reservation payment status

**Request:**
```json
{
  "platnoscStatus": "OPLACONA",
  "platnoscMetoda": "KARTA",
  "notatki": "Optional notes"
}
```

---

### DELETE /rezerwacje/:id
Cancel reservation (sets status to ANULOWANA)

---

### GET /rezerwacje/dostepnosc/check
Check therapist and cabinet availability

**Query Parameters:**
- `masazystaId` (required) - Therapist ID
- `gabinetId` (required) - Cabinet ID
- `godzinaOd` (required) - Start time (ISO datetime)
- `godzinaDo` (required) - End time (ISO datetime)

**Example:**
```
GET /rezerwacje/dostepnosc/check?masazystaId=id1&gabinetId=id2&godzinaOd=2025-12-10T10:00:00Z&godzinaDo=2025-12-10T11:00:00Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

### GET /rezerwacje/klient/:klientId
Get client's reservations

**Query Parameters:**
- `limit` (default: 10) - Number of recent reservations

---

## Schedule (Harmonogram) Endpoints

### POST /harmonogram
Create single schedule entry

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "masazystaId": "therapist-id",
  "data": "2025-12-10T00:00:00Z",
  "godzinaOd": "2025-12-10T08:00:00Z",
  "godzinaDo": "2025-12-10T18:00:00Z",
  "status": "PRACUJE"
}
```

**Status values:** PRACUJE | WOLNE | URLOP | CHOROBA

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "grafik-id",
    "masazystaId": "therapist-id",
    "masazysta": { "id": "...", "imie": "Maria", "nazwisko": "Nowak" },
    "data": "2025-12-10T00:00:00Z",
    "godzinaOd": "2025-12-10T08:00:00Z",
    "godzinaDo": "2025-12-10T18:00:00Z",
    "status": "PRACUJE",
    "createdAt": "2025-12-04T10:00:00Z",
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

### POST /harmonogram/bulk
Create multiple schedule entries in batch

**Request:**
```json
{
  "schedules": [
    {
      "masazystaId": "therapist-id",
      "data": "2025-12-10T00:00:00Z",
      "godzinaOd": "2025-12-10T08:00:00Z",
      "godzinaDo": "2025-12-10T18:00:00Z",
      "status": "PRACUJE"
    },
    {
      "masazystaId": "therapist-id",
      "data": "2025-12-11T00:00:00Z",
      "godzinaOd": "2025-12-11T08:00:00Z",
      "godzinaDo": "2025-12-11T18:00:00Z",
      "status": "PRACUJE"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": [ /* array of created schedules */ ],
  "message": "Successfully created 2 schedule(s)"
}
```

---

### GET /harmonogram
List schedule entries with filters and pagination

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `masazystaId` - Filter by therapist
- `data` - Specific date (ISO datetime)
- `dataOd` - Start date range (ISO datetime)
- `dataDo` - End date range (ISO datetime)
- `status` - Filter by status (PRACUJE, WOLNE, URLOP, CHOROBA)

**Example:**
```
GET /harmonogram?masazystaId=therapist-id&dataOd=2025-12-01T00:00:00Z&dataDo=2025-12-31T23:59:59Z&status=PRACUJE
```

---

### GET /harmonogram/:id
Get single schedule entry

---

### GET /harmonogram/masazysta/:masazystaId
Get therapist's schedule for date range

**Query Parameters:**
- `dataOd` (required) - Start date (ISO datetime)
- `dataDo` (required) - End date (ISO datetime)

**Example:**
```
GET /harmonogram/masazysta/therapist-id?dataOd=2025-12-01T00:00:00Z&dataDo=2025-12-31T23:59:59Z
```

---

### GET /harmonogram/masazysta/:masazystaId/dostepnosc
Get therapist's availability for specific date

**Query Parameters:**
- `data` (required) - Date to check (ISO datetime)

**Example:**
```
GET /harmonogram/masazysta/therapist-id/dostepnosc?data=2025-12-10T00:00:00Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "masazystaId": "therapist-id",
    "data": "2025-12-10T00:00:00Z",
    "schedule": { /* schedule entry */ },
    "reservations": [ /* array of reservations */ ],
    "available": true,
    "reason": null
  }
}
```

---

### PUT /harmonogram/:id
Update schedule entry

**Request:** Same as POST /harmonogram but all fields optional

---

### DELETE /harmonogram/:id
Delete schedule entry

---

## Packages (Pakiety) Endpoints

### Package Definitions

#### GET /pakiety/definicje
Get all active package definitions

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-def-id",
      "nazwa": "Pakiet 10 godzin",
      "liczbaGodzin": 10,
      "cena": "500.00",
      "waznoscDni": 90,
      "aktywny": true
    }
  ]
}
```

---

#### POST /pakiety/definicje
Create new package definition (MANAGER+ only)

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "nazwa": "Pakiet 10 godzin",
  "liczbaGodzin": 10,
  "cena": 500.00,
  "waznoscDni": 90
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pkg-def-id",
    "nazwa": "Pakiet 10 godzin",
    "liczbaGodzin": 10,
    "cena": "500.00",
    "waznoscDni": 90,
    "aktywny": true
  }
}
```

---

#### PUT /pakiety/definicje/:id
Update package definition (MANAGER+ only)

**Request:** Same as POST but all fields optional

---

### Client Packages

#### GET /pakiety?klientId=X&tylkoAktywne=true
Get packages for a client

**Query Parameters:**
- `klientId` (required) - Client ID
- `tylkoAktywne` (optional, default: false) - Show only active packages

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-id",
      "klientId": "client-id",
      "pakiet": { /* package definition */ },
      "godzinyWykupione": 10,
      "godzinyWykorzystane": 3,
      "godzinyPozostale": 7,
      "dataZakupu": "2025-12-01T10:00:00Z",
      "dataWaznosci": "2025-03-01T10:00:00Z",
      "status": "AKTYWNY",
      "wykorzystania": [ /* last 5 usages */ ]
    }
  ]
}
```

---

#### GET /pakiety/:id
Get package details with full usage history

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "pkg-id",
    "pakiet": { /* package definition */ },
    "klient": { "id": "...", "imie": "Jan", "nazwisko": "Kowalski", "telefon": "+48123456789" },
    "godzinyWykupione": 10,
    "godzinyWykorzystane": 3,
    "godzinyPozostale": 7,
    "dataZakupu": "2025-12-01T10:00:00Z",
    "dataWaznosci": "2025-03-01T10:00:00Z",
    "status": "AKTYWNY",
    "wykorzystania": [ /* all usages */ ]
  }
}
```

---

#### POST /pakiety
Sell package to client (RECEPCJA+ only)

**Request:**
```json
{
  "klientId": "client-id",
  "pakietDefinicjaId": "pkg-def-id",
  "metoda": "GOTOWKA"
}
```

**Payment Methods:** GOTOWKA | KARTA | PRZELEW

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "pkg-id",
    "klientId": "client-id",
    "pakiet": { /* package definition */ },
    "godzinyWykupione": 10,
    "godzinyWykorzystane": 0,
    "godzinyPozostale": 10,
    "dataZakupu": "2025-12-04T10:00:00Z",
    "dataWaznosci": "2025-03-04T10:00:00Z",
    "status": "AKTYWNY"
  }
}
```

---

#### GET /pakiety/:id/historia
Get package usage history (paginated)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "usage-id",
      "pakietKlientaId": "pkg-id",
      "rezerwacjaId": "res-id",
      "godzinyOdliczone": 2,
      "saldoPo": 8,
      "data": "2025-12-02T14:00:00Z",
      "rezerwacja": {
        "numer": "R-20251202-ABC123",
        "data": "2025-12-02T00:00:00Z",
        "godzinaOd": "2025-12-02T14:00:00Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### Package Alerts

#### GET /pakiety/konczace-sie
Get packages ending soon (remaining < 2 hours)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* packages with low hours */ ],
  "count": 2
}
```

---

#### GET /pakiety/wygasajace
Get packages expiring within specified days (default: 30)

**Query Parameters:**
- `dni` (optional, default: 30) - Number of days to check

**Example:**
```
GET /pakiety/wygasajace?dni=7
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* packages expiring soon */ ],
  "count": 5
}
```

---

## Vouchers (Vouchery) Endpoints

### GET /vouchery
Get all vouchers with filters and pagination

**Query Parameters:**
- `status` (optional) - Filter by status: AKTYWNY | WYKORZYSTANY | WYGASLY
- `typ` (optional) - Filter by type: KWOTOWY | USLUGOWY
- `zrodlo` (optional) - Filter by source: RECEPCJA | ONLINE
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 100) - Items per page

**Example:**
```
GET /vouchery?status=AKTYWNY&typ=KWOTOWY&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "voucher-id",
      "kod": "VOUCHER123ABC",
      "typ": "KWOTOWY",
      "wartoscPoczatkowa": "100.00",
      "wartoscPozostala": "50.00",
      "kupujacyImie": "Jan",
      "obdarowanyImie": "Maria",
      "dataZakupu": "2025-12-01T10:00:00Z",
      "dataWaznosci": "2026-12-01T10:00:00Z",
      "status": "AKTYWNY",
      "realizacje": [ /* realization history */ ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### GET /vouchery/:id
Get voucher details with full realization history

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "voucher-id",
    "kod": "VOUCHER123ABC",
    "typ": "KWOTOWY",
    "wartoscPoczatkowa": "100.00",
    "wartoscPozostala": "50.00",
    "kupujacyImie": "Jan",
    "kupujacyEmail": "jan@example.com",
    "obdarowanyImie": "Maria",
    "obdarowanyEmail": "maria@example.com",
    "wiadomosc": "Podarunek dla Ciebie!",
    "dataZakupu": "2025-12-01T10:00:00Z",
    "dataWaznosci": "2026-12-01T10:00:00Z",
    "status": "AKTYWNY",
    "zrodlo": "RECEPCJA",
    "realizacje": [
      {
        "id": "realization-id",
        "kwota": "50.00",
        "data": "2025-12-02T14:00:00Z",
        "rezerwacja": {
          "numer": "R-20251202-ABC123",
          "data": "2025-12-02T00:00:00Z",
          "godzinaOd": "2025-12-02T14:00:00Z",
          "klient": { "imie": "Maria", "nazwisko": "Nowak" },
          "usluga": { "nazwa": "Masaż relaksacyjny" }
        }
      }
    ]
  }
}
```

---

### GET /vouchery/kod/:kod
Check voucher by code (public endpoint, no auth required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "voucher-id",
    "kod": "VOUCHER123ABC",
    "typ": "KWOTOWY",
    "wartoscPoczatkowa": "100.00",
    "wartoscPozostala": "50.00",
    "kupujacyImie": "Jan",
    "obdarowanyImie": "Maria",
    "wiadomosc": "Podarunek dla Ciebie!",
    "dataWaznosci": "2026-12-01T10:00:00Z",
    "usluga": null
  }
}
```

---

### POST /vouchery
Create and sell new voucher (RECEPCJA+ only)

**Request:**
```json
{
  "typ": "KWOTOWY",
  "wartosc": 100.00,
  "kupujacyImie": "Jan",
  "kupujacyEmail": "jan@example.com",
  "obdarowanyImie": "Maria",
  "obdarowanyEmail": "maria@example.com",
  "wiadomosc": "Podarunek dla Ciebie!",
  "metoda": "KARTA",
  "zrodlo": "RECEPCJA"
}
```

**Voucher Types:**
- `KWOTOWY` - Fixed amount voucher (requires `wartosc`)
- `USLUGOWY` - Service voucher (requires `uslugaId`)

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "voucher-id",
    "kod": "VOUCHER123ABC",
    "typ": "KWOTOWY",
    "wartoscPoczatkowa": "100.00",
    "wartoscPozostala": "100.00",
    "kupujacyImie": "Jan",
    "dataZakupu": "2025-12-04T10:00:00Z",
    "dataWaznosci": "2026-12-04T10:00:00Z",
    "status": "AKTYWNY"
  }
}
```

---

### POST /vouchery/:id/realizuj
Redeem voucher for a reservation

**Request:**
```json
{
  "rezerwacjaId": "reservation-id",
  "kwota": 50.00
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "realization-id",
    "voucherId": "voucher-id",
    "rezerwacjaId": "reservation-id",
    "kwota": "50.00",
    "saldoPo": "50.00",
    "data": "2025-12-04T10:00:00Z"
  }
}
```

---

### PUT /vouchery/:id/przedluz
Extend voucher validity (WLASCICIEL only)

**Request:**
```json
{
  "nowaDataWaznosci": "2026-12-31T23:59:59Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "voucher-id",
    "kod": "VOUCHER123ABC",
    "dataWaznosci": "2026-12-31T23:59:59Z",
    "status": "AKTYWNY"
  }
}
```

---

### DELETE /vouchery/:id
Cancel voucher (WLASCICIEL only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "voucher-id",
    "kod": "VOUCHER123ABC",
    "status": "WYGASLY"
  }
}
```

---

### GET /vouchery/wygasajace
Get vouchers expiring within specified days (default: 30)

**Query Parameters:**
- `dni` (optional, default: 30) - Number of days to check

**Example:**
```
GET /vouchery/wygasajace?dni=7
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "voucher-id",
      "kod": "VOUCHER123ABC",
      "typ": "KWOTOWY",
      "wartoscPozostala": "100.00",
      "kupujacyImie": "Jan",
      "dataWaznosci": "2025-12-10T10:00:00Z",
      "status": "AKTYWNY"
    }
  ],
  "count": 5
}
```

---

## Services (Usługi) Endpoints

### GET /uslugi
List all services grouped by category with variants

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "service-id",
      "nazwa": "Massage",
      "kategoria": "RELAKSACYJNY",
      "opis": "Relaxing massage treatment",
      "warianty": [
        {
          "id": "variant-id",
          "nazwa": "Full Body",
          "czas_trwania": 60,
          "cena": "150.00"
        }
      ]
    }
  ]
}
```

---

### GET /uslugi/:id
Get single service with variants and add-ons

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "service-id",
    "nazwa": "Massage",
    "kategoria": "RELAKSACYJNY",
    "opis": "Relaxing massage treatment",
    "warianty": [ /* variants */ ],
    "doplaty": [ /* add-ons */ ]
  }
}
```

---

### POST /uslugi
Create new service (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Deep Tissue Massage",
  "kategoria": "TERAPEUTYCZNY",
  "opis": "Therapeutic deep tissue massage",
  "warianty": [
    {
      "nazwa": "30 min",
      "czas_trwania": 30,
      "cena": "75.00"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "service-id",
    "nazwa": "Deep Tissue Massage",
    "kategoria": "TERAPEUTYCZNY",
    "warianty": [ /* created variants */ ]
  }
}
```

---

### PUT /uslugi/:id
Update service (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Updated Service Name",
  "kategoria": "RELAKSACYJNY",
  "opis": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated service */ }
}
```

---

### POST /uslugi/:id/warianty
Add variant to service (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Premium",
  "czas_trwania": 90,
  "cena": "200.00"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "variant-id",
    "nazwa": "Premium",
    "czas_trwania": 90,
    "cena": "200.00"
  }
}
```

---

### PUT /uslugi/:id/warianty/:wariantId
Update service variant (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Premium Plus",
  "cena": "220.00"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated variant */ }
}
```

---

### DELETE /uslugi/:id/warianty/:wariantId
Delete service variant (MANAGER+ only)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Variant deleted successfully"
}
```

---

### GET /uslugi/doplaty
List all add-ons (supplements/extras)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "addon-id",
      "nazwa": "Aromatherapy",
      "cena": "25.00"
    }
  ]
}
```

---

### POST /uslugi/doplaty
Create new add-on (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Hot Stone Therapy",
  "cena": "35.00"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "addon-id",
    "nazwa": "Hot Stone Therapy",
    "cena": "35.00"
  }
}
```

---

### PUT /uslugi/doplaty/:id
Update add-on (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Hot Stone Premium",
  "cena": "40.00"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated add-on */ }
}
```

---

## Cabinets (Gabinety) Endpoints

### GET /gabinety
List all active cabinets/rooms

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cabinet-id",
      "nazwa": "Cabinet 1",
      "opis": "Relaxation room",
      "aktywny": true
    }
  ]
}
```

---

### GET /gabinety/:id
Get single cabinet details

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cabinet-id",
    "nazwa": "Cabinet 1",
    "opis": "Relaxation room",
    "aktywny": true
  }
}
```

---

### POST /gabinety
Create new cabinet (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "Cabinet 5",
  "opis": "Premium massage room"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "cabinet-id",
    "nazwa": "Cabinet 5",
    "opis": "Premium massage room",
    "aktywny": true
  }
}
```

---

### PUT /gabinety/:id
Update cabinet (MANAGER+ only)

**Request:**
```json
{
  "nazwa": "VIP Cabinet",
  "opis": "Luxury massage room"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated cabinet */ }
}
```

---

### GET /gabinety/:id/dostepnosc
Check cabinet availability for specific date/time

**Query Parameters:**
- `data` (required) - Date (ISO format)
- `godzina_od` (required) - Start time (HH:mm)
- `godzina_do` (required) - End time (HH:mm)

**Example:**
```
GET /gabinety/cabinet-id/dostepnosc?data=2025-12-05&godzina_od=14:00&godzina_do=16:00
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dostepny": true,
    "powod_niedostepnosci": null
  }
}
```

---

### GET /gabinety/:id/sprawdz-dostepnosc
Alternative availability check endpoint

**Query Parameters:**
- `data` (required)
- `godzina_od` (required)
- `godzina_do` (required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dostepny": true
  }
}
```

---

## Reports (Raporty) Endpoints

### GET /raporty/utarg/dzienny
Get daily revenue (MANAGER+ only)

**Query Parameters:**
- `data` (required) - Date (ISO format)

**Example:**
```
GET /raporty/utarg/dzienny?data=2025-12-04
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": "2025-12-04T00:00:00Z",
    "przychod_calkowity": "1500.00",
    "liczba_rezerwacji": 5,
    "srednia_cena": "300.00"
  }
}
```

---

### GET /raporty/utarg/miesieczy
Get monthly revenue by day (MANAGER+ only)

**Query Parameters:**
- `rok` (optional) - Year (default: current year)
- `miesiac` (optional) - Month (default: current month, 1-12)

**Example:**
```
GET /raporty/utarg/miesieczy?rok=2025&miesiac=12
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "data": "2025-12-01T00:00:00Z",
      "przychod": "1200.00",
      "rezerwacji": 4
    }
  ]
}
```

---

### GET /raporty/utarg/roczny
Get yearly revenue (MANAGER+ only)

**Query Parameters:**
- `rok` (required) - Year

**Example:**
```
GET /raporty/utarg/roczny?rok=2025
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "miesiac": 1,
      "nazwa_miesiaca": "January",
      "przychod": "15000.00"
    }
  ]
}
```

---

### GET /raporty/masazystki
Get therapist performance report (MANAGER+ only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "masazysta_id": "therapist-id",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "liczba_rezerwacji": 25,
      "przychod": "5000.00",
      "srednia_ocena": 4.8
    }
  ]
}
```

---

### GET /raporty/masazystki/:id
Get specific therapist performance (MANAGER+ only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "masazysta": { /* therapist details */ },
    "rezerwacje": 25,
    "przychod": "5000.00",
    "popularne_uslugi": [ /* top services */ ]
  }
}
```

---

### GET /raporty/statystyki/popularne-uslugi
Get most popular services (MANAGER+ only)

**Query Parameters:**
- `od` (optional) - Start date
- `do` (optional) - End date

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "usluga_id": "service-id",
      "nazwa": "Massage",
      "liczba_rezerwacji": 45,
      "przychod": "6750.00"
    }
  ]
}
```

---

### GET /raporty/statystyki/godziny-szczytu
Get peak hours analysis (MANAGER+ only)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "godzina": 14,
      "liczba_rezerwacji": 8,
      "oblozenije": "95%"
    }
  ]
}
```

---

### GET /raporty/statystyki/oblozenije
Get cabinet occupancy (MANAGER+ only)

**Query Parameters:**
- `od` (optional) - Start date
- `do` (optional) - End date

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "gabinet_id": "cabinet-id",
      "nazwa": "Cabinet 1",
      "oblozenije": "87%"
    }
  ]
}
```

---

### GET /raporty/zamkniecia
Get closing reports (MANAGER+ only)

**Query Parameters:**
- `od` (optional) - Start date
- `do` (optional) - End date
- `page` (default: 1)
- `limit` (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "closing-id",
      "data": "2025-12-04T00:00:00Z",
      "przychod": "1500.00",
      "liczba_rezerwacji": 5,
      "zamkniety_przez": "user-id"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

### GET /raporty/zamkniecia/:data
Get closing report for specific date (MANAGER+ only)

**Example:**
```
GET /raporty/zamkniecia/2025-12-04
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* closing details */ }
}
```

---

### GET /raporty/zamkniecia-podsumowanie
Get daily closing summary (MANAGER+ only)

**Query Parameters:**
- `data` (required) - Date (ISO format)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "data": "2025-12-04T00:00:00Z",
    "przychod_calkowity": "1500.00",
    "rezerwacji_calkowicie": 5,
    "rezerwacji_zakonczonych": 5,
    "liczba_klientow": 4
  }
}
```

---

### POST /raporty/zamkniecia
Create closing report (MANAGER+ only)

**Request:**
```json
{
  "data": "2025-12-04T00:00:00Z",
  "notatki": "All payments collected"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* created closing */ }
}
```

---

## SMS Endpoints

### POST /sms/wyslij
Send SMS to client (RECEPCJA+ only)

**Request:**
```json
{
  "klientId": "client-id",
  "tresc": "Zapraszamy na wizytę",
  "typ": "POTWIERDZENIE_REZERWACJI",
  "rezerwacjaId": "reservation-id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "sms-log-id",
    "klient_id": "client-id",
    "tresc": "Zapraszamy na wizytę",
    "typ": "POTWIERDZENIE_REZERWACJI",
    "status": "WYSLANY",
    "data_wyslania": "2025-12-04T10:30:00Z"
  }
}
```

---

### GET /sms/logi
Get SMS logs with filters

**Query Parameters:**
- `klientId` (optional) - Filter by client
- `rezerwacjaId` (optional) - Filter by reservation
- `typ` (optional) - Filter by type
- `page` (default: 1)
- `limit` (default: 10)

**Example:**
```
GET /sms/logi?klientId=client-id&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "sms-log-id",
      "klient": { "id": "...", "imie": "Jan", "telefon": "+48123456789" },
      "tresc": "Zapraszamy na wizytę",
      "typ": "POTWIERDZENIE_REZERWACJI",
      "status": "WYSLANY",
      "data_wyslania": "2025-12-04T10:30:00Z"
    }
  ],
  "pagination": { /* pagination info */ }
}
```

---

## Therapists (Masażyści) Endpoints

### GET /masazysci
List all therapists with pagination and filtering

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10, max: 100)
- `search` (optional) - Search by name or phone
- `tylko_aktywni` (optional, default: true) - Show only active therapists
- `gabinet` (optional) - Filter by cabinet/gabinet

**Example:**
```
GET /masazysci?page=1&limit=10&search=jan&tylko_aktywni=true
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "therapist-id",
      "imie": "Jan",
      "nazwisko": "Kowalski",
      "telefon": "+48123456789",
      "email": "jan.kowalski@example.com",
      "gabinetId": "cabinet-id",
      "aktywny": true,
      "createdAt": "2025-12-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET /masazysci/:id
Get single therapist details

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "therapist-id",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "telefon": "+48123456789",
    "email": "jan.kowalski@example.com",
    "gabinetId": "cabinet-id",
    "aktywny": true,
    "createdAt": "2025-12-01T10:00:00Z"
  }
}
```

---

### POST /masazysci
Create new therapist (MANAGER+ only)

**Request:**
```json
{
  "imie": "Jan",
  "nazwisko": "Kowalski",
  "telefon": "+48123456789",
  "email": "jan.kowalski@example.com",
  "gabinetId": "cabinet-id"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "therapist-id",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "telefon": "+48123456789",
    "email": "jan.kowalski@example.com",
    "gabinetId": "cabinet-id",
    "aktywny": true,
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

### PUT /masazysci/:id
Update therapist (MANAGER+ only)

**Request:**
```json
{
  "imie": "Jan",
  "nazwisko": "Nowak",
  "telefon": "+48987654321",
  "email": "jan.nowak@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "therapist-id",
    "imie": "Jan",
    "nazwisko": "Nowak",
    "telefon": "+48987654321",
    "email": "jan.nowak@example.com",
    "gabinetId": "cabinet-id",
    "aktywny": true,
    "updatedAt": "2025-12-04T11:00:00Z"
  }
}
```

---

### DELETE /masazysci/:id
Soft delete (deactivate) therapist (MANAGER+ only)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Therapist deactivated successfully"
}
```

---

### GET /masazysci/:id/grafik
Get therapist schedule for a date range

**Query Parameters:**
- `dataOd` (required) - Start date (ISO format)
- `dataDo` (required) - End date (ISO format)

**Example:**
```
GET /masazysci/therapist-id/grafik?dataOd=2025-12-01T00:00:00Z&dataDo=2025-12-31T23:59:59Z
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "schedule-id",
      "masazystaId": "therapist-id",
      "data": "2025-12-05T00:00:00Z",
      "godzinaOd": "09:00",
      "godzinaDo": "17:00",
      "dostepny": true
    }
  ]
}
```

---

### GET /masazysci/:id/rezerwacje
Get therapist reservations with filters

**Query Parameters:**
- `status` (optional) - Filter by status: POTWIERDZONY | ANULOWANY | ZAKONCZONY
- `dataOd` (optional) - Start date filter
- `dataDo` (optional) - End date filter
- `page` (default: 1)
- `limit` (default: 10)

**Example:**
```
GET /masazysci/therapist-id/rezerwacje?status=POTWIERDZONY&page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "reservation-id",
      "numer": "R-20251205-ABC123",
      "masazystaId": "therapist-id",
      "klientId": "client-id",
      "usługaId": "service-id",
      "data": "2025-12-05T00:00:00Z",
      "godzinaOd": "2025-12-05T14:00:00Z",
      "godzinaDo": "2025-12-05T16:00:00Z",
      "status": "POTWIERDZONY",
      "numer_telefonu": "+48123456789"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  },
  "masazysta": {
    "id": "therapist-id",
    "imie": "Jan",
    "nazwisko": "Kowalski",
    "telefon": "+48123456789"
  }
}
```

---

## Error Response Format

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Error message"
}
```

**Validation errors include:**
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "field": ["error message"]
  }
}
```
