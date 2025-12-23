# Lotos SPA - Backend

A modern backend system for managing a massage spa using TypeScript, Fastify, Prisma, and PostgreSQL.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Job Queue**: Bull + Redis
- **Cache**: Redis

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files (env, database)
│   ├── modules/         # Business modules
│   │   ├── auth/        # Authentication module
│   │   ├── klienci/     # Clients management
│   │   ├── masazysci/   # Therapists management
│   │   ├── rezerwacje/  # Reservations/Bookings
│   │   ├── pakiety/     # Packages
│   │   ├── vouchery/    # Vouchers
│   │   ├── raporty/     # Reports
│   │   └── sms/         # SMS notifications
│   ├── shared/          # Shared utilities, types, middleware
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema (to be created)
├── dist/                # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example         # Environment variables template
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database** (once Prisma schema is created):
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

## Available Scripts

- **`npm run dev`** - Start development server with hot reload
- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run start`** - Start production server
- **`npm test`** - Run tests (to be configured)

## Development

Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

Health check endpoint: `http://localhost:3000/health`

## Modules (To Be Implemented)

- [ ] **Auth** - User authentication and authorization
- [ ] **Clients** - Client management
- [ ] **Therapists** - Therapist/Masseuse management
- [ ] **Reservations** - Booking system
- [ ] **Packages** - Service packages
- [ ] **Vouchers** - Discount vouchers
- [ ] **Reports** - Business reports
- [ ] **SMS** - SMS notification system

## Environment Variables

See `.env.example` for required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `REDIS_URL` - Redis connection string
- `SMS_API_KEY` - SMS service API key
- `PORT` - Server port (default: 3000)

## License

ISC
