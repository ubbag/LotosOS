import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@types';
import { setupMockInterceptor } from './mockInterceptor';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Setup mock interceptor for demo mode
setupMockInterceptor(apiClient);

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse;
    if (data?.errors) {
      return Object.entries(data.errors)
        .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
        .join('\n');
    }
    return data?.message || error.message || 'An error occurred';
  }
  return 'An unexpected error occurred';
};

// Fetch functions for UI components
import type { Client, Employee, Reservation } from '@types';

/**
 * Fetch all clients from API and transform to UI format
 */
export const fetchClients = async (): Promise<Client[]> => {
  try {
    const response = await apiClient.get<ApiResponse>('/klienci');
    const klienci = response.data.data || [];

    return klienci.map((klient: any) => ({
      id: klient.id,
      imie: klient.imie,
      nazwisko: klient.nazwisko,
      name: `${klient.imie} ${klient.nazwisko}`,
      email: klient.email || undefined,
      phone: klient.telefon,
      status: klient.aktywny ? 'ACTIVE' : 'INACTIVE',
      lastVisit: 'Brak danych',
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(klient.imie)}+${encodeURIComponent(klient.nazwisko)}&background=random`,
    })) as Client[];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Fetch all employees from API and transform to UI format
 */
export const fetchEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await apiClient.get<ApiResponse>('/masazysci');
    const masazysci = response.data.data || [];

    return masazysci.map((masazysta: any) => {
      let specs: string[] = [];
      try {
        if (typeof masazysta.specjalizacje === 'string') {
          specs = JSON.parse(masazysta.specjalizacje);
        } else if (Array.isArray(masazysta.specjalizacje)) {
          specs = masazysta.specjalizacje;
        }
      } catch (e) {
        specs = masazysta.specjalizacje ? [masazysta.specjalizacje] : [];
      }

      return {
        id: masazysta.id,
        firstName: masazysta.imie,
        lastName: masazysta.nazwisko,
        status: masazysta.aktywny ? 'ACTIVE' : 'INACTIVE',
        specialization: Array.isArray(specs) ? specs : [],
      };
    }) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

/**
 * Fetch all reservations from API and transform to UI format
 */
export const fetchReservations = async (): Promise<Reservation[]> => {
  try {
    const response = await apiClient.get<ApiResponse>('/rezerwacje');
    const rezerwacje = response.data.data || [];

    return rezerwacje.map((rez: any) => {
      const dateObj = new Date(rez.godzinaOd);
      const timeStr = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const dateStr = new Date(rez.data).toISOString().split('T')[0];

      return {
        id: rez.id,
        reservationNumber: rez.numer,
        clientName: rez.klient ? `${rez.klient.imie} ${rez.klient.nazwisko}` : 'Nieznany klient',
        clientPhone: rez.klient ? rez.klient.telefon : '',
        serviceName: rez.usluga ? rez.usluga.nazwa : 'Usługa usunięta',
        date: dateStr,
        time: timeStr,
        duration: rez.wariant?.czasMinut || 0,
        therapistName: rez.masazysta
          ? `${rez.masazysta.imie} ${rez.masazysta.nazwisko}`
          : 'Brak terapeuty',
        roomName: rez.gabinet ? rez.gabinet.nazwa : 'Brak gabinetu',
        price: rez.cenaCalokowita || 0,
        status: rez.status,
      };
    }) as Reservation[];
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};
