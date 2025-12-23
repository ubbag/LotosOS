# Lotos SPA Frontend

Frontend React dla systemu zarządzania rezerwacjami masażu Lotos SPA.

## Technologia

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Axios** - HTTP client
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Instalacja

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Aplikacja będzie dostępna na `http://localhost:5173`

## Build

```bash
npm run build
```

## Struktura projektu

```
src/
├── components/          # Reusable components
├── pages/              # Page components
├── services/           # API services
├── stores/             # Zustand stores
├── types/              # TypeScript types
├── App.tsx             # Main app component
├── main.tsx            # Entry point
└── index.css           # Global styles
```

## Features

- ✅ Login/Logout
- ✅ Dashboard
- ✅ Zarządzanie klientami
- ✅ Zarządzanie rezerwacjami
- ✅ Ustawienia konta
- 🔄 Harmonogram (w rozwoju)
- 🔄 Pakiety (w rozwoju)
- 🔄 Vouchery (w rozwoju)
- 🔄 Raporty (w rozwoju)

## Konfiguracja API

Utwórz plik `.env.local`:

```
VITE_API_URL=http://localhost:3000
```

## Demo Login

- Email: `admin@example.com`
- Password: `hasło123`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
