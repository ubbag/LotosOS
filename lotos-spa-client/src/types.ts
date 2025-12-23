// User roles enum
export enum UserRole {
  RECEPCJA = 'RECEPCJA',
  MANAGER = 'MANAGER',
  WLASCICIEL = 'WLASCICIEL',
}

// User type
export interface User {
  id: string;
  email: string;
  imie: string;
  rola: UserRole;
  aktywny: boolean;
  ostatnieLogowanie: string | null;
  createdAt: string;
}

// Auth response
export interface AuthResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// Client type
export interface Client {
  id: string;
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string | null;
  zrodlo?: string | null;
  aktywny: boolean;
  createdAt: string;
  updatedAt: string;
}

// Client input
export interface ClientInput {
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string;
  zrodlo?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

// API error
export interface ApiError {
  success: boolean;
  code: number;
  message: string;
  details?: string;
  timestamp?: string;
  path?: string;
  method?: string;
}
