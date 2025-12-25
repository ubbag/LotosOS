# Lotos SPA - Spa Management System

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)

Complete spa booking and management system with backend API, admin dashboard, and client booking interface. Built with modern TypeScript stack for performance and maintainability.

## Project Structure

This repository contains three main components:

- **`backend/`** - RESTful API server (Fastify + Prisma + TypeScript)
- **`frontend/`** - Admin dashboard (React + TypeScript + Tailwind CSS)
- **`lotos-spa-client/`** - Client booking interface (React + TypeScript)
- **`gemini uiux/`** - Alternative UI/UX implementation

## Features

- 🔐 JWT-based authentication with role-based access control (Owner, Manager, Receptionist)
- 📅 Advanced reservation system with real-time availability
- 💳 Online payment integration (ready for Stripe, Przelewy24, PayU)
- 📱 SMS notifications and reminders
- 📧 Email notifications with templates
- 📊 Reporting and analytics
- 📦 Package management with expiration tracking
- 🎟️ Voucher system (monetary and service-based)
- ⏰ Automated job scheduling and background processing
- 🔄 Bull queues for reliable job processing
- 🐳 Docker support for easy deployment

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify 5.x
- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.x
- **Validation**: Zod 4.x
- **Authentication**: JWT
- **Job Queue**: Bull 4.x
- **Scheduling**: cron
- **Email**: Nodemailer
- **Language**: TypeScript 5.x

## Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 14 or higher (or SQLite for development)
- Redis 6.0 or higher (for job queues)
- npm or yarn

## Quick Start

### Using the start script (Windows)

```bash
# Run all services at once
start_all.bat
```

This will start:
- Backend API on `http://localhost:3000`
- Frontend admin dashboard on `http://localhost:5173`
- Client booking interface on `http://localhost:5174`

### Manual setup

See detailed installation instructions below for each component.

## Installation

### Backend Setup

#### 1. Clone the repository

```bash
git clone https://github.com/ubbag/LotosOS.git
cd LotosOS/backend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Environment Setup

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=3000
APP_NAME="Lotos SPA"
APP_VERSION=1.0.0

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lotos_spa"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION=24h

# Redis (for job queues)
REDIS_URL="redis://localhost:6379"

# SMS
SMS_PROVIDER=mock  # Options: mock, twilio, netopia, etc.
SMS_API_KEY=""
SMS_SENDER_NAME="LotosSPA"

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Payment
PAYMENT_PROVIDER=mock  # Options: mock, stripe, przelewy24, payu
PAYMENT_WEBHOOK_SECRET="your-webhook-secret"
APP_URL="http://localhost:3000"
```

#### 4. Setup Database

```bash
# Run migrations
npm run prisma:migrate

# (Optional) Seed test data
npm run seed
```

### Frontend Setup (Admin Dashboard)

#### 1. Navigate to frontend directory

```bash
cd ../frontend
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Environment Setup

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000
```

#### 4. Start development server

```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5173`

### Client Interface Setup

#### 1. Navigate to client directory

```bash
cd ../lotos-spa-client
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Environment Setup

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
```

#### 4. Start development server

```bash
npm run dev
```

The client booking interface will be available at `http://localhost:5174`

## Development

### Backend Development

```bash
cd backend
npm run dev  # Start on http://localhost:3000
```

### Frontend Development

```bash
cd frontend
npm run dev  # Start on http://localhost:5173
```

### Client Interface Development

```bash
cd lotos-spa-client
npm run dev  # Start on http://localhost:5174
```

### Build for Production

#### Backend
```bash
cd backend
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
npm run preview  # Test production build
```

#### Client Interface
```bash
cd lotos-spa-client
npm run build
npm run preview  # Test production build
```

## Database Management

### Run migrations

```bash
npm run prisma:migrate
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

### Generate Prisma client

```bash
npm run prisma:generate
```

## Seeding Test Data

Run the seed script to populate test data:

```bash
npm run seed
```

This creates:
- Admin user (admin@lotosspa.pl / admin123456)
- 4 therapists with schedules
- 12 massage rooms
- 5 services with variants
- 5 add-ons
- 4 package definitions
- 5 test clients with medical notes

## API Endpoints Overview

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token

### Clients Management
- `GET /klienci` - List all clients
- `POST /klienci` - Create client
- `GET /klienci/:id` - Get client details
- `PUT /klienci/:id` - Update client
- `DELETE /klienci/:id` - Delete client

### Services
- `GET /uslugi` - List all services
- `POST /uslugi` - Create service
- `PUT /uslugi/:id` - Update service

### Reservations
- `GET /rezerwacje` - List reservations
- `POST /rezerwacje` - Create reservation
- `PUT /rezerwacje/:id` - Update reservation
- `DELETE /rezerwacje/:id` - Cancel reservation

### Packages
- `GET /pakiety` - List packages
- `POST /pakiety` - Create package
- `GET /pakiety/:id/utilizacao` - Get package usage

### Vouchers
- `GET /vouchery` - List vouchers
- `POST /vouchery` - Create voucher
- `PUT /vouchery/:id/use` - Use voucher

### Public API (No Auth Required)
- `GET /public/uslugi` - Public services list
- `GET /public/masazysci` - Public therapists list
- `GET /public/dostepnosc` - Check availability
- `POST /public/rezerwacje` - Online reservation
- `POST /public/vouchery` - Online voucher purchase
- `POST /public/platnosci/webhook` - Payment webhook

## Job Scheduling

The system includes automated background jobs:

### Reminders
- **Daily at 10:00 AM** - Sends SMS reminders about upcoming reservations
- Smart scheduling based on day of week

### Package/Voucher Expiration
- **Daily at 6:00 AM** - Updates expired packages/vouchers to inactive
- **Weekly on Monday at 10:00 AM** - Sends notifications for soon-to-expire items

### Job Processing
Jobs are processed by Bull workers with automatic retry logic:
- SMS queue: 2 concurrent workers
- Email queue: 3 concurrent workers
- Automatic retry with exponential backoff

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {},
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

## Authentication

Protected routes require JWT token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

The system supports rate limiting via:
1. Reverse proxy (recommended for production)
2. Redis-based rate limiting

Configure via environment or API gateway.

## Pagination

List endpoints support pagination:

```
GET /klienci?page=1&limit=20
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasMore": true
  }
}
```

## Docker Deployment

### Build Docker image

```bash
docker build -t lotos-spa-backend .
```

### Run with docker-compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Lotos SPA backend service

### Environment in Docker

Create `.env.docker` or set via docker-compose environment variables.

## Logs

Logs are written to console with the following levels:
- **Development**: Debug level with pretty printing
- **Production**: Info level with structured JSON format

## Testing

Run tests (once test suite is implemented):

```bash
npm test
```

## Performance

### Database Optimization
- Proper indexing on frequently queried fields
- Connection pooling via Prisma
- Query optimization with selective includes

### Caching
- Redis for job queue management
- Session storage for performance

### Rate Limiting
- Per-IP rate limiting recommended
- Public endpoints have stricter limits

## Security

### Implemented Features
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- Input validation with Zod
- SQL injection prevention (Prisma ORM)
- CSRF protection via JSON validation
- Secure HTTP headers recommended

### Recommendations
- Use HTTPS in production
- Set strong JWT_SECRET
- Regularly update dependencies
- Enable database backups
- Use environment-specific configuration

## Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL format
postgresql://user:password@host:5432/database

# Test connection
npx prisma db push
```

### Redis Connection Issues
```bash
# Verify Redis is running
redis-cli ping

# Check REDIS_URL format
redis://localhost:6379
```

### Job Queue Issues
- Check Redis connection
- Monitor Bull dashboard (optional: bull-board)
- Check job worker logs

### Email Sending Issues
- Verify SMTP credentials
- Check EMAIL_USER and EMAIL_PASSWORD
- Test SMTP connection manually

## Architecture

### Backend Architecture

The backend follows a modular architecture:

```text
backend/src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── klienci/      # Client management
│   ├── uslugi/       # Services management
│   ├── rezerwacje/   # Reservation system
│   ├── pakiety/      # Package management
│   ├── vouchery/     # Voucher system
│   ├── masazysci/    # Therapist management
│   ├── gabinety/     # Room management
│   ├── harmonogram/  # Scheduling
│   ├── raporty/      # Reports & analytics
│   ├── sms/          # SMS notifications
│   ├── jobs/         # Background jobs
│   └── public/       # Public API endpoints
├── shared/           # Shared utilities
│   ├── errors.ts
│   ├── prisma.ts
│   └── middleware/
└── config/           # Configuration
```

### Frontend Architecture

Both frontend applications use:
- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Axios** for API communication

### Database Schema

The system uses Prisma ORM with support for both PostgreSQL and SQLite. Key entities:
- Users (with role-based permissions)
- Clients (with medical history)
- Services (with variants and add-ons)
- Reservations (with conflict detection)
- Packages (with expiration tracking)
- Vouchers (monetary and service-based)
- Therapists (with schedules and specializations)
- Rooms (with availability management)

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. Fork the repository
2. Create a feature branch from `main`
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Make your changes
4. Ensure code quality:
   ```bash
   # Run type checking
   npm run type-check

   # Run linter
   npm run lint

   # Run tests (if available)
   npm test
   ```
5. Commit your changes with descriptive messages
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. Push to your fork
   ```bash
   git push origin feature/amazing-feature
   ```
7. Open a Pull Request

### Commit Message Convention

We follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

## License

ISC License - See LICENSE file for details

## Roadmap

### Planned Features
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-location support
- [ ] Integration with more payment providers
- [ ] WhatsApp notifications
- [ ] Customer loyalty program
- [ ] Gift card system enhancements
- [ ] Calendar integrations (Google Calendar, Outlook)

## Support

For issues and support:
- Create an issue on [GitHub Issues](https://github.com/ubbag/LotosOS/issues)
- Contact: `support@lotosspa.pl`

## Changelog

### Version 1.0.0 (Initial Release)

#### Backend
- JWT authentication with RBAC
- Complete REST API with 150+ endpoints
- Prisma ORM with PostgreSQL/SQLite support
- Background job processing with Bull
- SMS and email notification system
- Payment integration framework
- Comprehensive error handling
- Docker deployment support

#### Frontend (Admin Dashboard)
- Modern React + TypeScript interface
- Complete CRUD operations for all entities
- Responsive design with Tailwind CSS
- Real-time reservation calendar
- Analytics and reporting views
- User management with role permissions

#### Client Interface
- Public booking system
- Service catalog with filtering
- Therapist selection
- Online payment integration
- Booking confirmation system
- Voucher purchase flow

---

**Repository**: [github.com/ubbag/LotosOS](https://github.com/ubbag/LotosOS)
**Last Updated**: December 2024
**Status**: Production Ready
**Maintainer**: CodeRabbit Ready
