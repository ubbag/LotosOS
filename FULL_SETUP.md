# Lotos SPA - Kompletna instrukcja uruchomienia

System do zarządzania rezerwacjami masażu z pełnym backendem i frontendem.

## 📋 Wymagania systemowe

- Node.js 18+
- npm 9+
- PostgreSQL 12+
- Git

## 🚀 Szybki Start

### 1. Konfiguracja Bazy Danych

```bash
# Upewnij się że PostgreSQL jest uruchomiony
# Utwórz bazę danych
createdb lotos_spa

# Lub w PostgreSQL shell:
CREATE DATABASE lotos_spa;
```

### 2. Backend Setup

```bash
cd backend

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiska
cp .env.example .env

# Edytuj .env (ustaw DATABASE_URL do twojej bazy danych)
DATABASE_URL="postgresql://user:password@localhost:5432/lotos_spa"
JWT_SECRET="your-secret-key-here"

# Uruchom migracje Prisma
npx prisma migrate dev

# (Opcjonalnie) Seed bazy danych
npx prisma db seed

# Uruchom development server
npm run dev
```

Backend będzie dostępny na: `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Instalacja zależności
npm install

# Konfiguracja zmiennych środowiska
cp .env.example .env.local

# Edytuj .env.local (lub zostaw domyślne jeśli backend na localhost:3000)
VITE_API_URL=http://localhost:3000

# Uruchom development server
npm run dev
```

Frontend będzie dostępny na: `http://localhost:5173`

## 📊 Architektura Systemu

```
┌─────────────────────────────────────────────────────────────┐
│                    Lotos SPA System                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend (React + Vite + Tailwind CSS)                    │
│  ├── Login & Auth                                          │
│  ├── Dashboard                                             │
│  ├── Clients Management                                    │
│  ├── Reservations                                          │
│  ├── Schedule                                              │
│  ├── Packages & Vouchers                                   │
│  ├── Reports                                               │
│  └── Settings                                              │
│                                                             │
│  ↓ HTTP/REST API (Axios)                                   │
│                                                             │
│  Backend (Fastify + TypeScript)                            │
│  ├── Authentication (JWT + bcrypt)                         │
│  ├── 91 REST Endpoints                                     │
│  ├── Zod Validation                                        │
│  ├── Error Handling                                        │
│  └── Background Jobs (Bull + Redis)                        │
│                                                             │
│  ↓ ORM (Prisma)                                            │
│                                                             │
│  PostgreSQL Database                                       │
│  ├── 19 Models                                             │
│  ├── Relationships & Constraints                           │
│  ├── Soft Deletes                                          │
│  └── Transaction Support                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Demo Credentials

```
Email: admin@example.com
Password: hasło123
Role: WLASCICIEL (Owner)
```

## 📚 API Documentation

API jest w pełni zdokumentowany. Zobacz:

- **Backend API**: `backend/API_ENDPOINTS.md` (91 endpoints)
- **Implementation Summary**: `backend/IMPLEMENTATION_SUMMARY.md`
- **Frontend Setup**: `FRONTEND_SETUP.md`

### Przykład API Call

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"hasło123"}'

# Odpowiedź
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "cuid...",
      "email": "admin@example.com",
      "imie": "Admin",
      "rola": "WLASCICIEL"
    }
  }
}

# Użyj tokenu w nagłówkach
curl http://localhost:3000/klienci \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## 📁 Struktura Projektu

```
lotos-system/
├── backend/                         # Node.js backend
│   ├── src/
│   │   ├── modules/                # 13 modules
│   │   │   ├── auth/               # Authentication
│   │   │   ├── klienci/            # Clients
│   │   │   ├── rezerwacje/         # Reservations
│   │   │   ├── harmonogram/        # Schedule
│   │   │   ├── uslugi/             # Services
│   │   │   ├── pakiety/            # Packages
│   │   │   ├── vouchery/           # Vouchers
│   │   │   ├── raporty/            # Reports
│   │   │   └── ...                 # More modules
│   │   ├── config/                 # Configuration
│   │   ├── shared/                 # Shared utilities
│   │   └── index.ts                # Main app
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # DB migrations
│   ├── API_ENDPOINTS.md            # API documentation
│   ├── IMPLEMENTATION_SUMMARY.md   # Backend summary
│   └── package.json
│
├── frontend/                        # React frontend
│   ├── src/
│   │   ├── components/             # UI components
│   │   ├── pages/                  # Page components
│   │   ├── services/               # API services
│   │   ├── stores/                 # Zustand stores
│   │   ├── types/                  # TypeScript types
│   │   ├── App.tsx                 # Routing
│   │   └── main.tsx                # Entry point
│   ├── index.html                  # HTML template
│   ├── README.md                   # Frontend docs
│   └── package.json
│
└── FULL_SETUP.md                   # This file
```

## 🛠️ Developing

### Backend Development

```bash
cd backend

# Development mode (auto-reload)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```

### Frontend Development

```bash
cd frontend

# Development mode
npm run dev

# Build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run tests (if configured)
npm test
```

### Frontend Tests

```bash
cd frontend

# Run tests (if configured)
npm test
```

## 📤 Deployment

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Docker Deployment

Wymagane pliki `Dockerfile` i `docker-compose.yml`:

```bash
# Build images
docker-compose build

# Run containers
docker-compose up

# Access:
# Frontend: http://localhost:80
# Backend: http://localhost:3000
# Database: localhost:5432
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database Connection Error

```bash
# Check PostgreSQL is running
psql -U postgres -d postgres

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/lotos_spa"
```

### CORS Issues

Frontend i backend muszą być na różnych portach - to jest normalne.
Backend pozwala na cross-origin requests dla frontendu.

### Login Fails

1. Sprawdź czy użytkownik istnieje:
   ```bash
   cd backend
   npx prisma studio
   # Sprawdź User model
   ```

2. Sprawdź JWT_SECRET:
   ```bash
   # Backend .env
   JWT_SECRET="your-secret-key"
   ```

3. Sprawdź API URL w frontend .env.local

## 📞 Support

Jeśli napotkasz problemy:

1. Sprawdź logi (DevTools w przeglądarce, terminal dla backendu)
2. Sprawdź czy wszystkie porty są dostępne
3. Sprawdź połączenie z bazą danych
4. Uruchom `npm install` ponownie w obu folderach

## 🎯 Następne Kroki

1. **Konfiguracja produkcji** - Setup SSL, domains, firewall
2. **Monitoring** - Dodaj logging, error tracking
3. **Backup** - Setup automatyczne backupy bazy danych
4. **Scaling** - Load balancer, caching (Redis)
5. **CI/CD** - GitHub Actions, GitLab CI, Jenkins
6. **Tests** - Unit, integration, E2E tests
7. **Security** - Rate limiting, DDoS protection, WAF

## 📄 Licencja

Proprietary - Lotos SPA System

## 👨‍💻 Development Info

- **Backend Modules**: 13
- **Backend Endpoints**: 91
- **Frontend Pages**: 5+
- **Frontend Components**: 6 base + page-specific
- **Database Models**: 19
- **Lines of Code**: 10,000+

---

Zbudowano z ❤️ przy użyciu React, Fastify, i Prisma
