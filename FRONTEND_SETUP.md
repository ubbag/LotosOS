# Frontend Setup - Lotos SPA

## Plik struktura Frontend

Nowy folder `frontend` zawiera kompletną aplikację React do zarządzania systemem Lotos SPA.

### Struktura katalogów

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Button.tsx           # Button with variants
│   │   ├── Card.tsx             # Card container
│   │   ├── Input.tsx            # Form input field
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Sidebar.tsx          # Side navigation
│   │   ├── Layout.tsx           # Main layout wrapper
│   │   └── index.ts             # Barrel export
│   ├── pages/                   # Page components
│   │   ├── LoginPage.tsx        # Login screen
│   │   ├── DashboardPage.tsx    # Dashboard/home
│   │   ├── KlienciPage.tsx      # Clients management
│   │   ├── RezerwacjePage.tsx   # Reservations management
│   │   ├── UstawieniaPage.tsx   # Settings
│   │   └── index.ts             # Barrel export
│   ├── services/                # API services
│   │   ├── api.ts               # Axios configuration
│   │   ├── auth.service.ts      # Auth API calls
│   │   └── index.ts             # Barrel export
│   ├── stores/                  # Zustand stores
│   │   └── authStore.ts         # Auth state management
│   ├── types/                   # TypeScript types
│   │   └── index.ts             # All type definitions
│   ├── App.tsx                  # Main app with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
├── .eslintrc.cjs                # ESLint config
├── .gitignore                   # Git ignore rules
├── .env.example                 # Environment template
└── README.md                    # Frontend specific docs
```

## Instalacja

### 1. Zainstaluj zależności

```bash
cd frontend
npm install
```

### 2. Skonfiguruj zmienne środowiska

Utwórz plik `.env.local`:

```bash
cp .env.example .env.local
```

Zawartość `.env.local`:

```
VITE_API_URL=http://localhost:3000
```

### 3. Uruchom development server

```bash
npm run dev
```

Aplikacja będzie dostępna na: `http://localhost:5173`

## Opcje npm

```bash
# Development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint

# Type checking
npm run type-check
```

## Zaimplementowane funkcje

### ✅ Ukończone

- **Authentication**
  - Login/logout
  - JWT token management
  - Protected routes
  - Auto-logout na 401

- **Components**
  - Header z informacjami użytkownika
  - Sidebar z nawigacją
  - Button (4 warianty)
  - Input z validacją
  - Card container
  - Layout wrapper

- **Pages**
  - Login page
  - Dashboard (stats)
  - Clients list & manage
  - Reservations list
  - Settings (profile + password change)

- **Services**
  - Axios HTTP client
  - API response interceptors
  - Error handling
  - Auth service

- **State Management**
  - Zustand auth store
  - Token persistence
  - User info caching

### 🔄 W rozwoju

Następujące moduły mają placeholder pages, gotowe do rozwoju:

- Harmonogram (Schedule)
- Usługi (Services)
- Pakiety (Packages)
- Vouchery (Vouchers)
- Gabinety (Cabinets)
- Masażyści (Therapists)
- Raporty (Reports)
- SMS

## Integracja z Backendem

Frontend łączy się z backendem na porcie 3000. Zapewni że:

1. Backend jest uruchomiony:
   ```bash
   cd backend
   npm run dev
   ```

2. Backend słucha na `http://localhost:3000`

3. Frontend serwuje na `http://localhost:5173`

## Użytkownik Demo

```
Email: admin@example.com
Hasło: hasło123
Rola: WLASCICIEL
```

## Struktura komponentów

### Button

```tsx
<Button variant="primary" size="lg" isLoading={false}>
  Klik mnie
</Button>
```

Warianty: `primary`, `secondary`, `danger`, `ghost`
Rozmiary: `sm`, `md`, `lg`

### Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="user@example.com"
  error={error}
  helperText="Wpisz swój email"
  icon={<Mail size={16} />}
/>
```

### Card

```tsx
<Card title="Nagłówek" description="Opis">
  Zawartość
</Card>
```

## Typy TypeScript

Wszystkie typy znajdują się w `src/types/index.ts`:

```typescript
- User - User object
- LoginRequest - Login form
- Klient - Client object
- Usluga - Service object
- Rezerwacja - Reservation object
- PakietKlienta - Client package
- Voucher - Voucher object
- ApiResponse - API response wrapper
```

## Deployment

### Production Build

```bash
npm run build
```

Wynik zostanie zapisany w `dist/` folder.

### Opcje deploymentu

1. **Vercel** (rekomendowane)
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Nginx** (self-hosted)
   ```nginx
   server {
     listen 80;
     server_name example.com;

     root /var/www/lotos-frontend/dist;

     location / {
       try_files $uri /index.html;
     }

     location /api {
       proxy_pass http://localhost:3000;
     }
   }
   ```

3. **Docker**
   ```dockerfile
   FROM node:20-alpine as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM node:20-alpine
   RUN npm install -g serve
   COPY --from=build /app/dist /srv
   CMD ["serve", "-s", "/srv", "-l", "5173"]
   ```

## Troubleshooting

### API connection issues
- Upewnij się że backend jest uruchomiony na porcie 3000
- Sprawdź `VITE_API_URL` w `.env.local`
- Otwórz DevTools i sprawdź network tab

### Login fails
- Sprawdź czy backend ma użytkownika z demo email
- Sprawdź czy JWT secret jest taki sam w backend i frontend

### Build errors
- Uruchom `npm run type-check` aby sprawdzić typy
- Wyczyść cache: `rm -rf node_modules/.vite`

## Następne kroki

1. Zakończ implementację pozostałych stron
2. Dodaj unit tests
3. Implementuj E2E tests
4. Setup CI/CD pipeline
5. Deployment do produkcji
