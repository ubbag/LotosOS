# Services & Rooms Modules Documentation

## Phase 2: Services (Usługi) & Rooms (Gabinety) Modules

### Overview
Two new modules were implemented to manage salon services and treatment rooms with complete CRUD operations, availability checking, and pricing management.

---

## Services Module (`src/modules/uslugi/`)

### Files Structure
```
uslugi/
├── uslugi.schemas.ts     # Zod validation schemas
├── uslugi.service.ts     # Business logic
└── uslugi.routes.ts      # API endpoints
```

### uslugi.schemas.ts
Zod schemas for validation:
- `createWariantSchema` - Service variant validation
- `createUslugaSchema` - Full service creation with variants
- `updateUslugaSchema` - Service update (partial fields)
- `updateWariantSchema` - Variant update
- `createDoplataSchema` - Add-on creation
- `updateDoplataSchema` - Add-on update

### uslugi.service.ts
Core business logic:

**Services:**
- `findAll()` - Get all active services grouped by category, sorted by order
- `findById(id)` - Get service with all variants
- `create(data)` - Create service with variants in transaction
- `update(id, data)` - Update service details
- `addWariant(uslugaId, data)` - Add variant to service
- `updateWariant(wariantId, data)` - Update existing variant
- `deleteWariant(wariantId)` - Delete variant

**Add-ons (Doplaty):**
- `findAllDoplaty()` - Get all active add-ons
- `createDoplata(data)` - Create new add-on
- `updateDoplata(id, data)` - Update add-on

### API Endpoints

**Services (all require authentication):**
```
GET    /uslugi                      List services grouped by category
GET    /uslugi/:id                  Get service with variants
POST   /uslugi                      Create service (MANAGER+)
PUT    /uslugi/:id                  Update service (MANAGER+)
POST   /uslugi/:id/warianty         Add variant (MANAGER+)
PUT    /uslugi/:id/warianty/:id     Update variant (MANAGER+)
DELETE /uslugi/:id/warianty/:id     Delete variant (MANAGER+)
```

**Add-ons (Doplaty):**
```
GET    /uslugi/doplaty              List add-ons
POST   /uslugi/doplaty              Create add-on (MANAGER+)
PUT    /uslugi/doplaty/:id          Update add-on (MANAGER+)
```

### Example: Create Service with Variants
```json
{
  "nazwa": "Swedish Massage",
  "kategoria": "Masaż Relaksacyjny",
  "opis": "Professional Swedish massage",
  "warianty": [
    {
      "czasMinut": 60,
      "cenaRegularna": "150.00",
      "cenaPromocyjna": "120.00"
    },
    {
      "czasMinut": 90,
      "cenaRegularna": "200.00"
    }
  ]
}
```

### Example: Create Add-on
```json
{
  "nazwa": "Hot Stones",
  "cena": "30.00"
}
```

---

## Rooms Module (`src/modules/gabinety/`)

### Files Structure
```
gabinety/
├── gabinety.schemas.ts    # Zod validation schemas
├── gabinety.service.ts    # Business logic
└── gabinety.routes.ts     # API endpoints
```

### gabinety.schemas.ts
Zod schemas:
- `createGabinetSchema` - Room creation (number + name required)
- `updateGabinetSchema` - Room update (partial fields)

### gabinety.service.ts
Business logic:

**CRUD Operations:**
- `findAll()` - Get all active rooms sorted by number
- `findById(id)` - Get single room
- `create(data)` - Create new room (checks number uniqueness)
- `update(id, data)` - Update room (checks number uniqueness)

**Availability Checking:**
- `sprawdzCzyWolny(gabinetId, data, godzinaOd, godzinaDo, excludeRezerwacjaId?)` - Check if room is free for time slot
- `getAvailabilityForDate(gabinetId, data, startHour, endHour)` - Get full day availability as 30-minute slots

### API Endpoints

**All require authentication:**
```
GET    /gabinety                           List all rooms
GET    /gabinety/:id                       Get room details
POST   /gabinety                           Create room (MANAGER+)
PUT    /gabinety/:id                       Update room (MANAGER+)
GET    /gabinety/:id/dostepnosc            Get day availability
GET    /gabinety/:id/sprawdz-dostepnosc    Check specific time slot
```

### Example: Create Room
```json
{
  "numer": "101",
  "nazwa": "Masaż Relaksacyjny"
}
```

### Example: Get Availability
```
GET /gabinety/:id/dostepnosc?data=2024-01-15&startHour=6&endHour=22
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "start": "2024-01-15T06:00:00.000Z",
      "end": "2024-01-15T06:30:00.000Z",
      "available": true
    },
    {
      "start": "2024-01-15T06:30:00.000Z",
      "end": "2024-01-15T07:00:00.000Z",
      "available": false
    }
  ]
}
```

### Example: Check Time Slot Availability
```
GET /gabinety/:id/sprawdz-dostepnosc?data=2024-01-15&godzinaOd=2024-01-15T10:00:00Z&godzinaDo=2024-01-15T11:00:00Z
```

Response:
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

## Database Schema Updates

### Usluga Model
```typescript
model Usluga {
  id              String
  nazwa           String          // Unique
  kategoria       String
  opis            String?         // Optional description
  aktywna         Boolean
  kolejnosc       Int             // Sorting order
  createdAt       DateTime
  updatedAt       DateTime
  wariantyUslugi  WariantUslugi[]
  rezerwacje      Rezerwacja[]
  vouchery        Voucher[]
}
```

### WariantUslugi Model
```typescript
model WariantUslugi {
  id              String
  uslugaId        String
  czasMinut       Int             // Duration in minutes
  cenaRegularna   Decimal(10,2)
  cenaPromocyjna  Decimal(10,2)?
  usluga          Usluga
  rezerwacje      Rezerwacja[]
}
```

### Doplata Model
```typescript
model Doplata {
  id                  String
  nazwa               String          // Unique
  cena                Decimal(10,2)
  aktywna             Boolean
  rezerwacjeDoplata   RezerwacjaDoplata[]
}
```

### Gabinet Model
```typescript
model Gabinet {
  id          String
  numer       String              // Unique room number
  nazwa       String              // Room name
  aktywny     Boolean
  rezerwacje  Rezerwacja[]
}
```

---

## Authorization

### Role-Based Access Control

**Public (Any Authenticated User):**
- View services and their variants
- View add-ons list
- View rooms
- Check room availability

**Manager+ (MANAGER, WLASCICIEL):**
- Create/edit/delete services
- Add/edit/delete service variants
- Create/edit add-ons
- Create/edit rooms

---

## Data Validation

### Services
- Service name: required, unique
- Category: required
- Description: optional
- Variants: at least 1 variant required
- Duration: positive integer (minutes)
- Regular price: required, positive decimal
- Promo price: optional, must be less than regular

### Rooms
- Room number: required, unique
- Room name: required
- Status: boolean (active/inactive)

### Add-ons
- Name: required, unique
- Price: required, positive decimal

---

## Error Handling

All standard HTTP errors apply:
- `400` - Validation errors (invalid input)
- `401` - Unauthorized (no token)
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate room number/service name)
- `500` - Server error

---

## Performance Considerations

### Indexes
- Services indexed by: active status, category, order
- Rooms indexed by: active status, number
- Add-ons indexed by: name

### Availability Checking
- Checks only active/confirmed/in-progress reservations
- Supports excluding specific reservations (for updates)
- Generates 30-minute slots for day view
- Efficient datetime overlap detection

### Grouping
- Services automatically grouped by category on fetch
- Sorted by sequence order for consistent ordering

---

## Integration with Reservations

These modules integrate with the reservation system:

**Services:**
- Services and variants are required for creating reservations
- Pricing is used for reservation cost calculation
- Service variants store duration which sets reservation times

**Rooms:**
- Rooms are assigned to each reservation
- Availability checking prevents double-booking
- Room status checked before creating reservations

**Add-ons:**
- Add-ons can be attached to reservations
- Pricing added to total reservation cost

---

## Testing Examples

### Create Service
```bash
curl -X POST http://localhost:3000/uslugi \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nazwa":"Massage",
    "kategoria":"Relaxation",
    "warianty":[{"czasMinut":60,"cenaRegularna":"150"}]
  }'
```

### Get Services Grouped
```bash
curl -X GET http://localhost:3000/uslugi \
  -H "Authorization: Bearer <token>"
```

### Create Room
```bash
curl -X POST http://localhost:3000/gabinety \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"numer":"101","nazwa":"Massage Room"}'
```

### Check Room Availability
```bash
curl -X GET "http://localhost:3000/gabinety/room-id/dostepnosc?data=2024-01-15" \
  -H "Authorization: Bearer <token>"
```

---

## Code Statistics

- **Files:** 6 new files (schemas, services, routes)
- **Service Classes:** 2 (UslugiService, GabinetyService)
- **API Endpoints:** 12 total
  - Services: 7 endpoints
  - Add-ons: 3 endpoints
  - Rooms: 5 endpoints (including availability)
- **Validation Schemas:** 7 Zod schemas

---

## Build Status
✅ TypeScript compilation successful
✅ All imports resolved
✅ Type safety enabled
✅ Ready for testing

---

Generated: 2025-12-03
