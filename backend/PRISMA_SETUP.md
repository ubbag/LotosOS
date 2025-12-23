# Prisma Setup - Lotos SPA Backend

## ✅ Completed

### 1. Schema Generated
- **File**: `prisma/schema.prisma`
- **Prisma Version**: v5 (stable, compatible with PostgreSQL)
- **Models**: 19 complete models with full relationships
- **Enums**: 10+ enums for all status types
- **Indexes**: Strategic indexes on frequently queried fields
- **Features**: Cascading deletes, unique constraints, decimal precision for pricing

### 2. Prisma Client Generated
```bash
✔ Generated Prisma Client (v5.22.0)
```

The Prisma Client is ready to use in your application code:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

## 📋 Database Setup Instructions

### Prerequisites
- PostgreSQL 12+ installed and running
- Create database: `lotos_spa`

### Option 1: Local PostgreSQL

1. **Create the database**:
```bash
createdb lotos_spa
```

2. **Update `.env` with your connection string**:
```
DATABASE_URL=postgresql://user:password@localhost:5432/lotos_spa
```

3. **Push schema to database**:
```bash
npx prisma db push
```

### Option 2: Cloud PostgreSQL (e.g., Supabase, Railway, Heroku)

1. **Get your connection string** from your database provider
2. **Update `.env`**:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```
3. **Run**:
```bash
npx prisma db push
```

## 🗄️ Database Schema Summary

### Core Tables (19 models)
- **users** - System users (receptionist, manager, owner)
- **klienci** - Clients/customers
- **notatkiKlienta** - Client notes (medical, important, info)
- **masazysci** - Therapists/masseuses
- **grafikPracy** - Work schedules
- **gabinety** - Treatment rooms
- **uslugi** - Services/treatments offered
- **wariantyUslugi** - Service variants with pricing
- **doplaty** - Additional charges
- **rezerwacje** - Reservations/bookings (core business entity)
- **rezerwacjeDoplata** - Add-ons to reservations
- **pakietyDefinicja** - Package definitions
- **pakietyKlienta** - Purchased packages by clients
- **wykorzystaniePakietu** - Package usage tracking
- **vouchery** - Gift certificates and vouchers
- **realizacjeVouchera** - Voucher redemption
- **transakcje** - Financial transactions
- **zamkniecia** - Daily closing reports
- **smsLogi** - SMS communication logs

### Key Features

#### 1. Complete Audit Trail
- `createdAt`, `updatedAt` on all business entities
- `createdById` tracking who created records

#### 2. Financial Precision
- All prices use `Decimal(10, 2)` for accuracy
- Support for multiple payment methods
- Payment status tracking

#### 3. Flexible Reservations
- Multiple statuses (NEW, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
- Multiple sources (PHONE, ONLINE, WALK_IN)
- Multiple payment methods (CASH, CARD, TRANSFER, PACKAGE, VOUCHER)

#### 4. Package Management
- Package definitions and individual purchases
- Automatic balance tracking
- Package usage logging

#### 5. Voucher System
- Monetary and service-based vouchers
- Redemption tracking
- Balance management

#### 6. Client Management
- Medical and important notes
- Multiple contact methods
- Source tracking

## 📝 Common Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes to database (creates tables)
npx prisma db push

# Create a migration
npx prisma migrate dev --name descriptive_name

# View database in Studio UI
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset

# Seed database with initial data
npx prisma db seed
```

## 🔗 Usage in Application

### Import and Initialize
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### Example Queries
```typescript
// Create a client
const klient = await prisma.klient.create({
  data: {
    imie: 'Jan',
    nazwisko: 'Kowalski',
    telefon: '+48123456789',
    email: 'jan@example.com',
  },
});

// Create a reservation
const rezerwacja = await prisma.rezerwacja.create({
  data: {
    numer: 'RES-20231201-001',
    klientId: klient.id,
    masazystaId: '...',
    gabinetId: '...',
    uslugaId: '...',
    wariantId: '...',
    data: new Date('2023-12-01'),
    godzinaOd: new Date('2023-12-01T10:00:00'),
    godzinaDo: new Date('2023-12-01T11:00:00'),
    cenaCalokowita: new Decimal('150.00'),
    status: 'NOWA',
    zrodlo: 'ONLINE',
    platnoscMetoda: 'KARTA',
    createdById: '...',
  },
  include: {
    klient: true,
    masazysta: true,
    usluga: true,
  },
});

// Query with relations
const rezerwacje = await prisma.rezerwacja.findMany({
  where: {
    status: 'POTWIERDZONA',
    data: {
      gte: new Date('2023-12-01'),
    },
  },
  include: {
    klient: true,
    masazysta: true,
  },
  orderBy: {
    data: 'asc',
  },
});
```

## 🎯 Next Steps

1. Set up PostgreSQL database
2. Update `.env` with DATABASE_URL
3. Run `npx prisma db push` to create tables
4. Optionally: create seed data with `prisma/seed.ts`
5. Start implementing API endpoints using Fastify

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
