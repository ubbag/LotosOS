// Auth
export interface User {
  id: string;
  email: string;
  imie: string;
  rola: 'RECEPCJA' | 'MANAGER' | 'WLASCICIEL';
  aktywny: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Clients
export interface Klient {
  id: string;
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string;
  notatki?: string;
  aktywny: boolean;
  createdAt: string;
}

export interface CreateKlientRequest {
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string;
  notatki?: string;
}

// Services
export interface WariantUslugi {
  id: string;
  czasMinut: number;
  cenaRegularna: number;
  cenaPromocyjna?: number;
}

export interface Usluga {
  id: string;
  nazwa: string;
  kategoria: string;
  opis?: string;
  aktywna?: boolean;
  kolejnosc?: number;
  wariantyUslugi: WariantUslugi[];
}

// Therapists
export interface Masazysta {
  id: string;
  imie: string;
  nazwisko: string;
  specjalizacje?: string[];
  jezyki?: string[];
  zdjecieUrl?: string;
  aktywny: boolean;
  kolejnosc?: number;
  createdAt: string;
}

// Cabinets
export interface Gabinet {
  id: string;
  numer: string;
  nazwa: string;
  aktywny: boolean;
}

// Reservations
export type StatusRezerwacji = 'NOWA' | 'POTWIERDZONA' | 'W TRAKCIE' | 'ZAKONCZONA' | 'ANULOWANA' | 'NO_SHOW';
export type StatusPlatnosci = 'NIEOPLACONA' | 'OPLACONA' | 'CZESCIOWO';
export type ZrodloRezerwacji = 'TELEFON' | 'ONLINE' | 'WALKIN';
export type PlatnoscMetoda = 'GOTOWKA' | 'KARTA' | 'PRZELEW' | 'PAKIET' | 'VOUCHER';

export interface Rezerwacja {
  id: string;
  numer: string;
  klientId: string;
  usługaId: string;
  masazystaId: string;
  gabinetId: string;
  data: string;
  godzinaOd: string;
  godzinaDo: string;
  status: StatusRezerwacji;
  statusPlatnosci: StatusPlatnosci;
  cena: string;
  notatki?: string;
  createdAt: string;
}

export interface CreateRezerwacjaRequest {
  klientId: string;
  usługaId: string;
  wariantId: string;
  masazystaId: string;
  gabinetId: string;
  data: string;
  godzinaOd: string;
  godzinaDo: string;
  notatki?: string;
}

// Packages
export interface Pakiet {
  id: string;
  nazwa: string;
  godziny: number;
  cena: string;
  dni_waznosci: number;
}

export interface PakietKlienta {
  id: string;
  klientId: string;
  pakiet: Pakiet;
  godzinyWykupione: number;
  godzinyWykorzystane: number;
  godzinyPozostale: number;
  dataZakupu: string;
  dataWaznosci: string;
  status: 'AKTYWNY' | 'WYGASLY' | 'WYKORZYSTANY';
}

// Vouchers
export interface Voucher {
  id: string;
  kod: string;
  typ: 'KWOTOWY' | 'USLUGOWY';
  wartoscPoczatkowa: string;
  wartoscPozostala: string;
  kupujacyImie: string;
  obdarowanyImie: string;
  dataZakupu: string;
  dataWaznosci: string;
  status: 'AKTYWNY' | 'WYKORZYSTANY' | 'WYGASLY';
}

// Schedule
export interface GrafikEntry {
  id: string;
  masazystaId: string;
  data: string;
  godzinaOd: string;
  godzinaDo: string;
  status: 'PRACUJE' | 'WOLNY' | 'URLOP' | 'CHORY';
}

// Pagination
export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// UI Display Types (for frontend views)
export interface Client {
  id: string;
  imie: string;
  nazwisko: string;
  name: string; // Combined "imie nazwisko" for display
  email?: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastVisit?: string;
  avatarUrl?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE';
  specialization: string[];
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  therapistName: string;
  roomName: string;
  price: number;
  status: 'NOWA' | 'POTWIERDZONA' | 'ZAKONCZONA' | 'ANULOWANA';
  resStartDateTime?: Date; // For schedule positioning
}

export interface Category {
  id: string;
  name: string;
  serviceCount: number;
  order: number;
}

export interface Room {
  id: string;
  number: string;
  name: string;
  notes: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Package {
  id: string;
  name: string;
  totalHours: number;
  usedHours: number;
  price: number;
  active: boolean;
  color: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  active: boolean;
}

export interface VoucherDisplay {
  id: string;
  code: string;
  originalValue: number;
  currentValue: number;
  expiryDate: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  purchaser: string;
  type: 'AMOUNT' | 'SERVICE';
}

// Roster/Schedule Types
export interface Shift {
  id: string;
  employeeId: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: 'WORK' | 'LEAVE' | 'SICK';
}
